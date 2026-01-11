require_relative '../../../application/ports/product_repository'
require_relative '../../../domain/entities/product'

module Infrastructure
  module Adapters
    module Repositories
      class SequelProductRepository < Application::Ports::ProductRepository
        def initialize(db)
          @db = db
          @products = db[:products]
        end

        def find_all(filters: {})
          dataset = @products
          dataset = apply_filters(dataset, filters)
          dataset.all.map { |row| map_to_entity(row) }
        end

        def find_by_id(id)
          row = @products.where(id: id).first
          row ? map_to_entity(row) : nil
        end

        def find_by_category(category)
          @products
            .where(category: category)
            .all
            .map { |row| map_to_entity(row) }
        end

        def search(query)
          pattern = "%#{query.downcase}%"
          @products
            .where(Sequel.like(:name, pattern, case_insensitive: true) |
                   Sequel.like(:description, pattern, case_insensitive: true) |
                   Sequel.like(:category, pattern, case_insensitive: true))
            .all
            .map { |row| map_to_entity(row) }
        end

        def create(product_data)
          id = @products.insert(
            name: product_data[:name],
            price: product_data[:price],
            original_price: product_data[:original_price],
            rating: product_data[:rating] || 0.0,
            reviews: product_data[:reviews] || 0,
            category: product_data[:category],
            description: product_data[:description],
            image: product_data[:image],
            badge_text: product_data[:badge_text],
            badge_variant: product_data[:badge_variant],
            created_at: Time.now,
            updated_at: Time.now
          )
          find_by_id(id)
        end

        def update(id, product_data)
          @products.where(id: id).update(
            product_data.merge(updated_at: Time.now)
          )
          find_by_id(id)
        end

        def delete(id)
          @products.where(id: id).delete > 0
        end

        def count
          @products.count
        end

        private

        def apply_filters(dataset, filters)
          dataset = dataset.where(category: filters[:category]) if filters[:category]
          dataset = dataset.where { price <= filters[:max_price] } if filters[:max_price]
          dataset = dataset.where { price >= filters[:min_price] } if filters[:min_price]
          dataset = dataset.order(filters[:sort_by] || :id)
          dataset
        end

        def map_to_entity(row)
          Domain::Entities::Product.new(
            id: row[:id],
            name: row[:name],
            price: row[:price].to_f,
            original_price: row[:original_price]&.to_f,
            rating: row[:rating].to_f,
            reviews: row[:reviews],
            category: row[:category],
            description: row[:description],
            image: row[:image],
            badge_text: row[:badge_text],
            badge_variant: row[:badge_variant],
            created_at: row[:created_at],
            updated_at: row[:updated_at]
          )
        end
      end
    end
  end
end
