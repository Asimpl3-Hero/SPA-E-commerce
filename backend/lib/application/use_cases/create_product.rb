require 'dry-monads'

module Application
  module UseCases
    class CreateProduct
      include Dry::Monads[:result]

      REQUIRED_FIELDS = [:name, :price, :category, :description, :image].freeze

      def initialize(product_repository)
        @product_repository = product_repository
      end

      def call(product_data)
        # Railway: Validate required fields
        validation_result = validate_product_data(product_data)
        return validation_result if validation_result.failure?

        # Railway: Create product
        product = @product_repository.create(product_data)
        Success(product.to_h)
      rescue StandardError => e
        # Railway: Error handling
        Failure({ type: :server_error, message: e.message })
      end

      private

      def validate_product_data(data)
        # Check required fields
        missing_fields = REQUIRED_FIELDS.select { |field| data[field].nil? || data[field].to_s.strip.empty? }

        return Failure({ type: :validation_error, message: 'Missing required fields', details: { missing: missing_fields } }) unless missing_fields.empty?

        # Validate price
        price = data[:price].to_f
        return Failure({ type: :validation_error, message: 'Price must be greater than 0' }) if price <= 0

        # Validate original_price if present
        if data[:original_price]
          original_price = data[:original_price].to_f
          return Failure({ type: :validation_error, message: 'Original price must be greater than price' }) if original_price <= price
        end

        Success(true)
      end
    end
  end
end
