require_relative '../../../application/ports/customer_repository'
require_relative '../../../domain/entities/customer'

module Infrastructure
  module Adapters
    module Repositories
      class SequelCustomerRepository < Application::Ports::CustomerRepository
        def initialize(db)
          @db = db
          @customers = db[:customers]
        end

        def find_by_id(id)
          row = @customers.where(id: id).first
          row ? map_to_entity(row) : nil
        end

        def find_by_email(email)
          row = @customers.where(email: email).first
          row ? map_to_entity(row) : nil
        end

        def create(customer_data)
          id = @customers.insert(
            email: customer_data[:email],
            full_name: customer_data[:full_name],
            phone_number: customer_data[:phone_number],
            created_at: Time.now,
            updated_at: Time.now
          )
          find_by_id(id)
        end

        def update(id, customer_data)
          @customers.where(id: id).update(
            customer_data.merge(updated_at: Time.now)
          )
          find_by_id(id)
        end

        def create_or_update_by_email(customer_data)
          existing = find_by_email(customer_data[:email])

          if existing
            update(existing.id, {
              full_name: customer_data[:full_name],
              phone_number: customer_data[:phone_number]
            })
          else
            create(customer_data)
          end
        end

        private

        def map_to_entity(row)
          Domain::Entities::Customer.new(
            id: row[:id],
            email: row[:email],
            full_name: row[:full_name],
            phone_number: row[:phone_number],
            created_at: row[:created_at],
            updated_at: row[:updated_at]
          )
        end
      end
    end
  end
end
