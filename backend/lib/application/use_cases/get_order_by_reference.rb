require_relative '../../domain/value_objects/result'

module Application
  module UseCases
    class GetOrderByReference
      include Dry::Monads[:result]

      def initialize(order_repository:)
        @order_repository = order_repository
      end

      def execute(reference)
        return Failure({ type: :validation_error, message: 'Reference is required' }) if reference.nil? || reference.empty?

        result = @order_repository.find_with_details(reference)

        if result
          Success(format_order_response(result))
        else
          Failure({ type: :not_found, message: 'Order not found' })
        end
      rescue => e
        Failure({ type: :server_error, message: "Failed to retrieve order: #{e.message}" })
      end

      private

      def format_order_response(data)
        order = data[:order]
        customer = data[:customer]
        transaction = data[:transaction]
        delivery = data[:delivery]

        response = {
          id: order[:id],
          reference: order[:reference],
          amount_in_cents: order[:amount_in_cents],
          currency: order[:currency],
          status: order[:status],
          items: order[:items],
          created_at: order[:created_at],
          updated_at: order[:updated_at]
        }

        if customer
          response[:customer_email] = customer[:email]
          response[:customer_name] = customer[:full_name]
          response[:customer_phone] = customer[:phone_number]
        end

        if transaction
          response[:wompi_transaction_id] = transaction[:wompi_transaction_id]
          response[:transaction_status] = transaction[:status]
        end

        if delivery
          response[:shipping_address] = {
            address_line_1: delivery[:address_line_1],
            address_line_2: delivery[:address_line_2],
            city: delivery[:city],
            region: delivery[:region],
            country: delivery[:country],
            postal_code: delivery[:postal_code],
            delivery_status: delivery[:status]
          }
        end

        response
      end
    end
  end
end
