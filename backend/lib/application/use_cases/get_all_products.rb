require 'dry-monads'

module Application
  module UseCases
    class GetAllProducts
      include Dry::Monads[:result]

      def initialize(product_repository)
        @product_repository = product_repository
      end

      def call(filters: {})
        # Railway: Success path
        products = @product_repository.find_all(filters: filters)
        Success({ products: products.map(&:to_h) })
      rescue StandardError => e
        # Railway: Failure path
        Failure({ type: :server_error, message: e.message })
      end
    end
  end
end
