require_relative '../../domain/value_objects/result'
require_relative '../../infrastructure/adapters/payment/wompi_service'
require 'oj'

module Application
  module UseCases
    class ProcessPayment
      include Dry::Monads[:result]

      def initialize(database)
        @db = database
      end

      def execute(order_data, payment_method)
        get_acceptance_token
          .bind { |token| prepare_transaction_params(order_data, payment_method, token) }
          .bind { |params| call_wompi_api(params) }
          .bind { |result| create_transaction_record(order_data, payment_method, result) }
          .bind { |result| update_order_with_transaction(order_data, result) }
          .bind { |result| update_stock_if_approved(order_data, result) }
          .bind { |result| update_delivery_if_approved(order_data, result) }
      end

      private

      def get_acceptance_token
        token = Infrastructure::Adapters::Payment::WompiService.get_acceptance_token

        if token
          Success(token)
        else
          Failure({ type: :server_error, message: 'Failed to get acceptance token')
        end
      rescue => e
        Failure({ type: :server_error, message: "Error getting acceptance token: #{e.message}")
      end

      def prepare_transaction_params(order_data, payment_method, acceptance_token)
        payment_type = payment_method[:type] || 'CARD'

        params = {
          acceptance_token: acceptance_token[:acceptance_token],
          amount_in_cents: order_data[:amount_in_cents],
          currency: order_data[:currency] || 'COP',
          customer_email: order_data[:customer_email],
          full_name: order_data[:customer_name],
          phone_number: order_data[:customer_phone],
          payment_method_type: payment_type,
          reference: order_data[:reference],
          redirect_url: order_data[:redirect_url],
          shipping_address: order_data[:shipping_address]
        }

        # Add payment-specific params
        if payment_type == 'CARD'
          params[:payment_token] = payment_method[:token]
        elsif payment_type == 'NEQUI'
          params[:nequi_phone_number] = payment_method[:phone_number]
        end

        Success(params)
      end

      def call_wompi_api(params)
        result = Infrastructure::Adapters::Payment::WompiService.create_transaction(params)

        if result[:success]
          Success(result[:data][:data])
        else
          Failure({ type: :payment_failed, error: result[:error], reference: params[:reference] })
        end
      rescue => e
        Failure({ type: :server_error, message: "Wompi API error: #{e.message}")
      end

      def create_transaction_record(order_data, payment_method, wompi_data)
        payment_type = payment_method[:type] || 'CARD'

        transaction_id = @db[:transactions].insert(
          wompi_transaction_id: wompi_data[:id],
          reference: order_data[:reference],
          amount_in_cents: order_data[:amount_in_cents],
          currency: order_data[:currency] || 'COP',
          status: wompi_data[:status],
          payment_method_type: payment_type,
          payment_method_token: payment_type == 'CARD' ? payment_method[:token] : nil,
          payment_data: Oj.dump(wompi_data),
          created_at: Time.now,
          updated_at: Time.now
        )

        Success({
          transaction_id: transaction_id,
          wompi_data: wompi_data,
          order_data: order_data
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to create transaction record: #{e.message}")
      end

      def update_order_with_transaction(order_data, result)
        order_status = map_wompi_status(result[:wompi_data][:status])

        @db[:orders].where(id: order_data[:order_id]).update(
          transaction_id: result[:transaction_id],
          status: order_status,
          updated_at: Time.now
        )

        Success(result.merge(order_status: order_status))
      rescue => e
        Failure({ type: :server_error, message: "Failed to update order: #{e.message}")
      end

      def update_stock_if_approved(order_data, result)
        if result[:wompi_data][:status] == 'APPROVED'
          update_product_stock(order_data[:items], :decrement)
        end

        Success(result)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update stock: #{e.message}")
      end

      def update_delivery_if_approved(order_data, result)
        if result[:wompi_data][:status] == 'APPROVED' && order_data[:delivery_id]
          @db[:deliveries].where(id: order_data[:delivery_id]).update(
            status: 'assigned',
            estimated_delivery_date: Time.now + (3 * 24 * 60 * 60),
            updated_at: Time.now
          )
        end

        Success(result)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update delivery: #{e.message}")
      end

      def map_wompi_status(wompi_status)
        case wompi_status
        when 'APPROVED'
          'approved'
        when 'DECLINED'
          'declined'
        when 'VOIDED'
          'voided'
        when 'ERROR'
          'error'
        when 'PENDING'
          'processing'
        else
          'pending'
        end
      end

      def update_product_stock(items, operation)
        items.each do |item|
          product_id = item[:product_id]
          quantity = item[:quantity]

          product = @db[:products].where(id: product_id).first
          next unless product

          if operation == :decrement
            new_stock = [product[:stock] - quantity, 0].max
            @db[:products].where(id: product_id).update(
              stock: new_stock,
              updated_at: Time.now
            )
          elsif operation == :increment
            new_stock = product[:stock] + quantity
            @db[:products].where(id: product_id).update(
              stock: new_stock,
              updated_at: Time.now
            )
          end
        end
      end
    end
  end
end
