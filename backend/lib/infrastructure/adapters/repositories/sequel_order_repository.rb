require_relative '../../../application/ports/order_repository'
require_relative '../../../domain/entities/order'
require 'oj'

module Infrastructure
  module Adapters
    module Repositories
      class SequelOrderRepository < Application::Ports::OrderRepository
        def initialize(db)
          @db = db
          @orders = db[:orders]
        end

        def find_by_id(id)
          row = @orders.where(id: id).first
          row ? map_to_entity(row) : nil
        end

        def find_by_reference(reference)
          row = @orders.where(reference: reference).first
          row ? map_to_entity(row) : nil
        end

        def find_with_details(reference)
          row = @db[:orders]
            .left_join(:customers, id: Sequel[:orders][:customer_id])
            .left_join(:transactions, id: Sequel[:orders][:transaction_id])
            .left_join(:deliveries, id: Sequel[:orders][:delivery_id])
            .where(Sequel[:orders][:reference] => reference)
            .select(
              Sequel[:orders][:id].as(:order_id),
              Sequel[:orders][:reference],
              Sequel[:orders][:amount_in_cents],
              Sequel[:orders][:currency],
              Sequel[:orders][:status],
              Sequel[:orders][:items],
              Sequel[:orders][:created_at],
              Sequel[:orders][:updated_at],
              Sequel[:customers][:id].as(:customer_id),
              Sequel[:customers][:email].as(:customer_email),
              Sequel[:customers][:full_name].as(:customer_name),
              Sequel[:customers][:phone_number].as(:customer_phone),
              Sequel[:transactions][:id].as(:transaction_id),
              Sequel[:transactions][:wompi_transaction_id],
              Sequel[:transactions][:status].as(:transaction_status),
              Sequel[:deliveries][:id].as(:delivery_id),
              Sequel[:deliveries][:address_line_1],
              Sequel[:deliveries][:address_line_2],
              Sequel[:deliveries][:city],
              Sequel[:deliveries][:region],
              Sequel[:deliveries][:country],
              Sequel[:deliveries][:postal_code],
              Sequel[:deliveries][:status].as(:delivery_status)
            )
            .first

          return nil unless row

          items = row[:items]
          items = Oj.load(items, symbol_keys: true) if items.is_a?(String)

          {
            order: {
              id: row[:order_id],
              reference: row[:reference],
              amount_in_cents: row[:amount_in_cents],
              currency: row[:currency],
              status: row[:status],
              items: items,
              created_at: row[:created_at],
              updated_at: row[:updated_at]
            },
            customer: row[:customer_id] ? {
              id: row[:customer_id],
              email: row[:customer_email],
              full_name: row[:customer_name],
              phone_number: row[:customer_phone]
            } : nil,
            transaction: row[:transaction_id] ? {
              id: row[:transaction_id],
              wompi_transaction_id: row[:wompi_transaction_id],
              status: row[:transaction_status]
            } : nil,
            delivery: row[:delivery_id] ? {
              id: row[:delivery_id],
              address_line_1: row[:address_line_1],
              address_line_2: row[:address_line_2],
              city: row[:city],
              region: row[:region],
              country: row[:country],
              postal_code: row[:postal_code],
              status: row[:delivery_status]
            } : nil
          }
        end

        def create(order_data)
          items = order_data[:items]
          items_json = items.is_a?(String) ? items : Oj.dump(items, mode: :compat)

          id = @orders.insert(
            reference: order_data[:reference] || Domain::Entities::Order.generate_reference,
            customer_id: order_data[:customer_id],
            delivery_id: order_data[:delivery_id],
            transaction_id: order_data[:transaction_id],
            amount_in_cents: order_data[:amount_in_cents],
            currency: order_data[:currency] || 'COP',
            status: order_data[:status] || 'pending',
            items: items_json,
            created_at: Time.now,
            updated_at: Time.now
          )
          find_by_id(id)
        end

        def update(id, order_data)
          update_data = order_data.dup
          if update_data[:items] && !update_data[:items].is_a?(String)
            update_data[:items] = Oj.dump(update_data[:items], mode: :compat)
          end
          update_data[:updated_at] = Time.now

          @orders.where(id: id).update(update_data)
          find_by_id(id)
        end

        def update_status(id, status)
          update(id, { status: status })
        end

        def update_transaction(id, transaction_id, status)
          update(id, { transaction_id: transaction_id, status: status })
        end

        private

        def map_to_entity(row)
          items = row[:items]
          items = Oj.load(items, symbol_keys: true) if items.is_a?(String)

          Domain::Entities::Order.new(
            id: row[:id],
            reference: row[:reference],
            customer_id: row[:customer_id],
            delivery_id: row[:delivery_id],
            transaction_id: row[:transaction_id],
            amount_in_cents: row[:amount_in_cents],
            currency: row[:currency],
            status: row[:status],
            items: items,
            created_at: row[:created_at],
            updated_at: row[:updated_at]
          )
        end
      end
    end
  end
end
