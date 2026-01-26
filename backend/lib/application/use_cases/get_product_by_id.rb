require 'dry-monads'

module Application
  module UseCases
    class GetProductById
      include Dry::Monads[:result]

      def initialize(product_repository)
        @product_repository = product_repository
      end

      def call(id)
        # Railway: Validate input
        return Failure({ type: :validation_error, message: 'Invalid product ID' }) if id.nil? || id.to_i <= 0

        # Railway: Find product
        product = @product_repository.find_by_id(id.to_i)

        # Railway: Check if found
        if product
          Success(product.to_h)
        else
          Failure({ type: :not_found, message: "Product with id #{id} not found" })
        end
      rescue StandardError => e
        # Railway: Error handling
        Failure({ type: :server_error, message: e.message })
      end
    end
  end
end
