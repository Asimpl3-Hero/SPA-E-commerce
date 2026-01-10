require_relative '../../domain/value_objects/result'

module Application
  module UseCases
    class GetAllCategories
      include Dry::Monads[:result]

      def initialize(product_repository)
        @product_repository = product_repository
      end

      def call
        # Railway: Get all products and extract unique categories
        products = @product_repository.find_all
        categories = products.map(&:category).uniq.sort

        Success(categories)
      rescue StandardError => e
        # Railway: Error handling
        Failure({ type: :server_error, message: e.message })
      end
    end
  end
end
