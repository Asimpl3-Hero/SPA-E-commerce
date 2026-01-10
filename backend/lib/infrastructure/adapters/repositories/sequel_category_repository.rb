require_relative '../../../../application/ports/category_repository'
require_relative '../../../../domain/entities/category'

module Infrastructure
  module Adapters
    module Repositories
      class SequelCategoryRepository < Application::Ports::CategoryRepository
        def initialize(db)
          @db = db
          @categories = db[:categories]
        end

        def find_all
          @categories.all.map { |row| map_to_entity(row) }
        end

        def find_by_id(id)
          row = @categories.where(id: id).first
          row ? map_to_entity(row) : nil
        end

        def find_by_slug(slug)
          row = @categories.where(slug: slug).first
          row ? map_to_entity(row) : nil
        end

        def create(category_data)
          id = @categories.insert(
            name: category_data[:name],
            slug: category_data[:slug],
            created_at: Time.now
          )
          find_by_id(id)
        end

        private

        def map_to_entity(row)
          Domain::Entities::Category.new(
            id: row[:id],
            name: row[:name],
            slug: row[:slug],
            created_at: row[:created_at]
          )
        end
      end
    end
  end
end
