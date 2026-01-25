require_relative '../../../application/ports/delivery_repository'
require_relative '../../../domain/entities/delivery'

module Infrastructure
  module Adapters
    module Repositories
      class SequelDeliveryRepository < Application::Ports::DeliveryRepository
        def initialize(db)
          @db = db
          @deliveries = db[:deliveries]
        end

        def find_by_id(id)
          row = @deliveries.where(id: id).first
          row ? map_to_entity(row) : nil
        end

        def create(delivery_data)
          id = @deliveries.insert(
            address_line_1: delivery_data[:address_line_1],
            address_line_2: delivery_data[:address_line_2],
            city: delivery_data[:city],
            region: delivery_data[:region],
            country: delivery_data[:country] || 'CO',
            postal_code: delivery_data[:postal_code],
            phone_number: delivery_data[:phone_number],
            delivery_notes: delivery_data[:delivery_notes],
            status: delivery_data[:status] || 'pending',
            estimated_delivery_date: delivery_data[:estimated_delivery_date],
            created_at: Time.now,
            updated_at: Time.now
          )
          find_by_id(id)
        end

        def update(id, delivery_data)
          @deliveries.where(id: id).update(
            delivery_data.merge(updated_at: Time.now)
          )
          find_by_id(id)
        end

        def update_status(id, status, estimated_delivery_date: nil)
          update_data = { status: status }
          update_data[:estimated_delivery_date] = estimated_delivery_date if estimated_delivery_date
          update(id, update_data)
        end

        private

        def map_to_entity(row)
          Domain::Entities::Delivery.new(
            id: row[:id],
            address_line_1: row[:address_line_1],
            address_line_2: row[:address_line_2],
            city: row[:city],
            region: row[:region],
            country: row[:country],
            postal_code: row[:postal_code],
            phone_number: row[:phone_number],
            delivery_notes: row[:delivery_notes],
            status: row[:status],
            estimated_delivery_date: row[:estimated_delivery_date],
            created_at: row[:created_at],
            updated_at: row[:updated_at]
          )
        end
      end
    end
  end
end
