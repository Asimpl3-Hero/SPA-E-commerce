require 'dry-monads'
require_relative '../../domain/entities/order'
require_relative '../../domain/services/order_price_calculator'

module Application
  module UseCases
    class CreateOrder
      include Dry::Monads[:result]

      def initialize(customer_repository:, delivery_repository:, order_repository:, product_repository:)
        @customer_repository = customer_repository
        @delivery_repository = delivery_repository
        @order_repository = order_repository
        @product_repository = product_repository
        @price_calculator = Domain::Services::OrderPriceCalculator.new
      end

      def execute(order_data)
        validate_required_fields(order_data)
          .bind { |data| resolve_product_prices(data) }
          .bind { |data| validate_amount(data) }
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

      # Resuelve precios desde el repositorio (orquestación en capa de aplicación)
      def resolve_product_prices(order_data)
        priced_items = []

        order_data[:items].each do |item|
          product = @product_repository.find_by_id(item[:product_id])

          if product.nil?
            return Failure({
              type: :validation_error,
              message: "Product with ID #{item[:product_id]} not found"
            })
          end

          priced_items << {
            product_id: item[:product_id],
            price_cents: (product.price * 100).to_i,
            quantity: item[:quantity].to_i
          }
        end

        Success(order_data.merge(priced_items: priced_items))
      end

      def validate_amount(order_data)
        validation = @price_calculator.validate_amount(
          order_data[:priced_items],
          order_data[:amount_in_cents]
        )

        if validation[:valid]
          Success(order_data.merge(
            amount_in_cents: validation[:calculated_amount_cents],
            price_breakdown: validation[:breakdown]
          ))
        else
          Failure({
            type: :price_mismatch,
            message: 'The provided amount does not match the calculated total',
            details: {
              provided: validation[:provided_amount_cents],
              calculated: validation[:calculated_amount_cents],
              difference: validation[:difference_cents]
            }
          })
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
