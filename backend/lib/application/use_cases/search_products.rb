require 'dry-monads'

module Application
  module UseCases
    class SearchProducts
      include Dry::Monads[:result]

      def initialize(product_repository)
        @product_repository = product_repository
      end

      def call(query:, category: nil)
        # Railway: Validate input
        return Success({ products: [] }) if query.nil? || query.strip.empty?

        # Railway: Search products
        products = if category && !category.strip.empty?
                    @product_repository.find_by_category(category)
                      .select { |p| matches_query?(p, query) }
                  else
                    @product_repository.search(query)
                  end

        Success({ products: products.map(&:to_h) })
      rescue StandardError => e
        # Railway: Error handling
        Failure({ type: :server_error, message: e.message })
      end

      private

      def matches_query?(product, query)
        pattern = query.downcase
        product.name.downcase.include?(pattern) ||
          product.description.downcase.include?(pattern) ||
          (product.category&.downcase&.include?(pattern) || false)
      end
    end
  end
end
