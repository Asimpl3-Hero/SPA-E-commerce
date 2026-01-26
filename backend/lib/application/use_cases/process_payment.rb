require 'dry-monads'
require_relative '../../domain/entities/order'

module Application
  module UseCases
    class ProcessPayment
      include Dry::Monads[:result]

      def initialize(order_repository:, transaction_repository:, delivery_repository:, product_repository:, payment_gateway:)
        @order_repository = order_repository
        @transaction_repository = transaction_repository
        @delivery_repository = delivery_repository
        @product_repository = product_repository
        @payment_gateway = payment_gateway
      end

      def execute(order_data, payment_method)
        get_acceptance_token
          .bind { |token| prepare_transaction_params(order_data, payment_method, token) }
          .bind { |params| call_payment_gateway(params) }
          .bind { |result| create_transaction_record(order_data, payment_method, result) }
          .bind { |result| update_order_with_transaction(order_data, result) }
          .bind { |result| update_stock_if_approved(order_data, result) }
          .bind { |result| update_delivery_if_approved(order_data, result) }
      end

      # Create a failed transaction record when payment fails
      def create_failed_transaction(order_data, payment_method, error)
        payment_type = payment_method[:type] || 'CARD'

        transaction = @transaction_repository.create({
          reference: order_data[:reference],
          amount_in_cents: order_data[:amount_in_cents],
          currency: order_data[:currency] || 'COP',
          status: 'ERROR',
          payment_method_type: payment_type,
          payment_data: error
        })

        @order_repository.update_transaction(
          order_data[:order_id],
          transaction.id,
          'error'
        )

        transaction
      end

      private

      def get_acceptance_token
        token = @payment_gateway.get_acceptance_token

        if token
          Success(token)
        else
          Failure({ type: :server_error, message: 'Failed to get acceptance token' })
        end
      rescue => e
        Failure({ type: :server_error, message: "Error getting acceptance token: #{e.message}" })
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

        if payment_type == 'CARD'
          params[:payment_token] = payment_method[:token]
        elsif payment_type == 'NEQUI'
          params[:nequi_phone_number] = payment_method[:phone_number]
        end

        Success(params)
      end

      def call_payment_gateway(params)
        result = @payment_gateway.create_transaction(params)

        if result[:success]
          Success(result[:data][:data])
        else
          Failure({ type: :payment_failed, error: result[:error], reference: params[:reference] })
        end
      rescue => e
        Failure({ type: :server_error, message: "Payment gateway error: #{e.message}" })
      end

      def create_transaction_record(order_data, payment_method, wompi_data)
        payment_type = payment_method[:type] || 'CARD'

        transaction = @transaction_repository.create({
          wompi_transaction_id: wompi_data[:id],
          reference: order_data[:reference],
          amount_in_cents: order_data[:amount_in_cents],
          currency: order_data[:currency] || 'COP',
          status: wompi_data[:status],
          payment_method_type: payment_type,
          payment_method_token: payment_type == 'CARD' ? payment_method[:token] : nil,
          payment_data: wompi_data
        })

        Success({
          transaction_id: transaction.id,
          wompi_data: wompi_data,
          order_data: order_data
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to create transaction record: #{e.message}" })
      end

      def update_order_with_transaction(order_data, result)
        order_status = Domain::Entities::Order.map_wompi_status(result[:wompi_data][:status])

        @order_repository.update_transaction(
          order_data[:order_id],
          result[:transaction_id],
          order_status
        )

        Success(result.merge(order_status: order_status))
      rescue => e
        Failure({ type: :server_error, message: "Failed to update order: #{e.message}" })
      end

      def update_stock_if_approved(order_data, result)
        if result[:wompi_data][:status] == 'APPROVED'
          update_product_stock(order_data[:items], :decrement)
        end

        Success(result)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update stock: #{e.message}" })
      end

      def update_delivery_if_approved(order_data, result)
        if result[:wompi_data][:status] == 'APPROVED' && order_data[:delivery_id]
          estimated_date = Time.now + (3 * 24 * 60 * 60)
          @delivery_repository.update_status(
            order_data[:delivery_id],
            'assigned',
            estimated_delivery_date: estimated_date
          )
        end

        Success(result)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update delivery: #{e.message}" })
      end

      def update_product_stock(items, operation)
        items.each do |item|
          product_id = item[:product_id]
          quantity = item[:quantity]

          product = @product_repository.find_by_id(product_id)
          next unless product

          current_stock = product.stock
          new_stock = if operation == :decrement
            [current_stock - quantity, 0].max
          else
            current_stock + quantity
          end

          @product_repository.update(product_id, { stock: new_stock })
        end
      end
    end
  end
end
