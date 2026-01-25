require_relative '../../domain/value_objects/result'
require_relative '../../domain/entities/order'

module Application
  module UseCases
    class ProcessExistingOrderPayment
      include Dry::Monads[:result]

      def initialize(order_repository:, transaction_repository:, delivery_repository:, product_repository:, payment_gateway:)
        @order_repository = order_repository
        @transaction_repository = transaction_repository
        @delivery_repository = delivery_repository
        @product_repository = product_repository
        @payment_gateway = payment_gateway
      end

      def execute(payment_data)
        find_order(payment_data[:reference])
          .bind { |order_details| get_acceptance_token(order_details) }
          .bind { |data| prepare_transaction_params(data, payment_data) }
          .bind { |data| call_payment_gateway(data) }
          .bind { |data| create_transaction_record(data, payment_data) }
          .bind { |data| update_order_with_transaction(data) }
          .bind { |data| update_stock_if_approved(data) }
          .bind { |data| update_delivery_if_approved(data) }
      end

      private

      def find_order(reference)
        order_details = @order_repository.find_with_details(reference)

        if order_details
          Success(order_details)
        else
          Failure({ type: :not_found, message: 'Order not found' })
        end
      end

      def get_acceptance_token(order_details)
        token = @payment_gateway.get_acceptance_token

        if token
          Success({ order_details: order_details, acceptance_token: token })
        else
          Failure({ type: :server_error, message: 'Failed to get acceptance token' })
        end
      rescue => e
        Failure({ type: :server_error, message: "Error getting acceptance token: #{e.message}" })
      end

      def prepare_transaction_params(data, payment_data)
        order = data[:order_details][:order]
        customer = data[:order_details][:customer]
        delivery = data[:order_details][:delivery]

        shipping_address = nil
        if delivery
          shipping_address = {
            address_line_1: delivery[:address_line_1],
            address_line_2: delivery[:address_line_2],
            city: delivery[:city],
            region: delivery[:region],
            country: delivery[:country],
            postal_code: delivery[:postal_code],
            phone_number: delivery[:phone_number]
          }
        end

        params = {
          acceptance_token: data[:acceptance_token][:acceptance_token],
          amount_in_cents: order[:amount_in_cents],
          currency: order[:currency],
          customer_email: customer[:email],
          full_name: customer[:full_name],
          phone_number: customer[:phone_number],
          payment_method_type: payment_data[:payment_method_type],
          payment_token: payment_data[:payment_token],
          reference: order[:reference],
          redirect_url: payment_data[:redirect_url],
          shipping_address: shipping_address
        }

        Success({
          params: params,
          order_details: data[:order_details]
        })
      end

      def call_payment_gateway(data)
        result = @payment_gateway.create_transaction(data[:params])

        if result[:success]
          Success({
            wompi_data: result[:data][:data],
            order_details: data[:order_details],
            params: data[:params]
          })
        else
          # Create failed transaction record
          create_failed_transaction(data[:order_details], data[:params], result[:error])
          Failure({ type: :payment_failed, error: result[:error] })
        end
      rescue => e
        Failure({ type: :server_error, message: "Payment gateway error: #{e.message}" })
      end

      def create_failed_transaction(order_details, params, error)
        order = order_details[:order]

        transaction = @transaction_repository.create({
          reference: order[:reference],
          amount_in_cents: order[:amount_in_cents],
          currency: order[:currency],
          status: 'ERROR',
          payment_method_type: params[:payment_method_type],
          payment_data: error
        })

        @order_repository.update_transaction(order[:id], transaction.id, 'error')
      end

      def create_transaction_record(data, payment_data)
        wompi_data = data[:wompi_data]
        order = data[:order_details][:order]

        transaction = @transaction_repository.create({
          wompi_transaction_id: wompi_data[:id],
          reference: order[:reference],
          amount_in_cents: order[:amount_in_cents],
          currency: order[:currency],
          status: wompi_data[:status],
          payment_method_type: payment_data[:payment_method_type],
          payment_method_token: payment_data[:payment_token],
          payment_data: wompi_data
        })

        Success({
          transaction: transaction,
          wompi_data: wompi_data,
          order_details: data[:order_details]
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to create transaction record: #{e.message}" })
      end

      def update_order_with_transaction(data)
        order = data[:order_details][:order]
        wompi_data = data[:wompi_data]
        transaction = data[:transaction]

        order_status = Domain::Entities::Order.map_wompi_status(wompi_data[:status])

        @order_repository.update_transaction(order[:id], transaction.id, order_status)

        Success({
          transaction: transaction,
          wompi_data: wompi_data,
          order_details: data[:order_details],
          order_status: order_status
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to update order: #{e.message}" })
      end

      def update_stock_if_approved(data)
        if data[:wompi_data][:status] == 'APPROVED'
          items = data[:order_details][:order][:items]
          update_product_stock(items, :decrement)
        end

        Success(data)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update stock: #{e.message}" })
      end

      def update_delivery_if_approved(data)
        delivery = data[:order_details][:delivery]

        if data[:wompi_data][:status] == 'APPROVED' && delivery
          estimated_date = Time.now + (3 * 24 * 60 * 60)
          @delivery_repository.update_status(
            delivery[:id],
            'assigned',
            estimated_delivery_date: estimated_date
          )
        end

        Success(data)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update delivery: #{e.message}" })
      end

      def update_product_stock(items, operation)
        return unless items.is_a?(Array)

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
