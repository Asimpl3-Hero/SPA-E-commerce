require 'dry-monads'

module Application
  module UseCases
    class GetAllCategories
      include Dry::Monads[:result]

      def initialize(category_repository)
        @category_repository = category_repository
      end

      def call
        # Railway: Get all categories from the database
        categories = @category_repository.find_all
        # Convert entities to hash representation
        category_hashes = categories.map(&:to_h)

        Success(category_hashes)
      rescue StandardError => e
        # Railway: Error handling
        Failure({ type: :server_error, message: e.message })
      end
    end
  end
end
