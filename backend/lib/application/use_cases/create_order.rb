require_relative '../../domain/value_objects/result'
require_relative '../../domain/entities/order'

module Application
  module UseCases
    class CreateOrder
      include Dry::Monads[:result]

      def initialize(customer_repository:, delivery_repository:, order_repository:)
        @customer_repository = customer_repository
        @delivery_repository = delivery_repository
        @order_repository = order_repository
      end

      def execute(order_data)
        validate_required_fields(order_data)
          .bind { |data| create_or_update_customer(data) }
          .bind { |data| create_delivery_if_needed(data) }
          .bind { |data| create_order_record(data) }
      end

      private

      def validate_required_fields(order_data)
        required_fields = [:customer_email, :customer_name, :items, :amount_in_cents]
        missing_fields = required_fields.select { |field| order_data[field].nil? }

        if missing_fields.any?
          Failure({ type: :validation_error, message: 'Missing required fields', details: { missing: missing_fields } })
        else
          Success(order_data)
        end
      end

      def create_or_update_customer(order_data)
        customer = @customer_repository.create_or_update_by_email({
          email: order_data[:customer_email],
          full_name: order_data[:customer_name],
          phone_number: order_data[:customer_phone]
        })

        Success(order_data.merge(customer_id: customer.id))
      rescue => e
        Failure({ type: :server_error, message: "Failed to create/update customer: #{e.message}" })
      end

      def create_delivery_if_needed(order_data)
        delivery_id = nil

        if order_data[:shipping_address]
          addr = order_data[:shipping_address]
          delivery = @delivery_repository.create({
            address_line_1: addr[:address_line_1] || addr[:address],
            address_line_2: addr[:address_line_2],
            city: addr[:city],
            region: addr[:region] || addr[:state],
            country: addr[:country] || 'CO',
            postal_code: addr[:postal_code],
            phone_number: addr[:phone_number] || order_data[:customer_phone],
            delivery_notes: addr[:notes],
            status: 'pending'
          })
          delivery_id = delivery.id
        end

        Success(order_data.merge(delivery_id: delivery_id))
      rescue => e
        Failure({ type: :server_error, message: "Failed to create delivery: #{e.message}" })
      end

      def create_order_record(order_data)
        reference = Domain::Entities::Order.generate_reference

        order = @order_repository.create({
          reference: reference,
          customer_id: order_data[:customer_id],
          delivery_id: order_data[:delivery_id],
          amount_in_cents: order_data[:amount_in_cents],
          currency: order_data[:currency] || 'COP',
          status: 'pending',
          items: order_data[:items]
        })

        Success({
          order_id: order.id,
          reference: order.reference,
          customer_id: order.customer_id,
          delivery_id: order.delivery_id,
          amount_in_cents: order.amount_in_cents,
          currency: order.currency,
          items: order.items
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to create order: #{e.message}" })
      end
    end
  end
end
