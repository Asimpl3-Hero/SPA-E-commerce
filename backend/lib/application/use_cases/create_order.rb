require_relative '../../domain/value_objects/result'
require 'oj'

module Application
  module UseCases
    class CreateOrder
      include Dry::Monads[:result]

      def initialize(database)
        @db = database
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
        customer = @db[:customers].where(email: order_data[:customer_email]).first

        customer_id = if customer
          # Update existing customer
          @db[:customers].where(id: customer[:id]).update(
            full_name: order_data[:customer_name],
            phone_number: order_data[:customer_phone],
            updated_at: Time.now
          )
          customer[:id]
        else
          # Create new customer
          @db[:customers].insert(
            email: order_data[:customer_email],
            full_name: order_data[:customer_name],
            phone_number: order_data[:customer_phone],
            created_at: Time.now,
            updated_at: Time.now
          )
        end

        Success(order_data.merge(customer_id: customer_id))
      rescue => e
        Failure({ type: :server_error, message: "Failed to create/update customer: #{e.message}" })
      end

      def create_delivery_if_needed(order_data)
        delivery_id = nil

        if order_data[:shipping_address]
          addr = order_data[:shipping_address]
          delivery_id = @db[:deliveries].insert(
            address_line_1: addr[:address_line_1] || addr[:address],
            address_line_2: addr[:address_line_2],
            city: addr[:city],
            region: addr[:region] || addr[:state],
            country: addr[:country] || 'CO',
            postal_code: addr[:postal_code],
            phone_number: addr[:phone_number] || order_data[:customer_phone],
            delivery_notes: addr[:notes],
            status: 'pending',
            created_at: Time.now,
            updated_at: Time.now
          )
        end

        Success(order_data.merge(delivery_id: delivery_id))
      rescue => e
        Failure({ type: :server_error, message: "Failed to create delivery: #{e.message}" })
      end

      def create_order_record(order_data)
        reference = generate_reference

        order_id = @db[:orders].insert(
          reference: reference,
          customer_id: order_data[:customer_id],
          delivery_id: order_data[:delivery_id],
          amount_in_cents: order_data[:amount_in_cents],
          currency: order_data[:currency] || 'COP',
          status: 'pending',
          items: Oj.dump(order_data[:items]),
          created_at: Time.now,
          updated_at: Time.now
        )

        Success({
          order_id: order_id,
          reference: reference,
          customer_id: order_data[:customer_id],
          delivery_id: order_data[:delivery_id],
          amount_in_cents: order_data[:amount_in_cents],
          currency: order_data[:currency] || 'COP',
          items: order_data[:items]
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to create order: #{e.message}" })
      end

      def generate_reference
        "ORDER-#{Time.now.to_i}-#{rand(1000..9999)}"
      end
    end
  end
end
