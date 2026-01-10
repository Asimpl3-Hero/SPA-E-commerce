require 'dry-monads'

module Domain
  module ValueObjects
    # Railway Oriented Programming Result type
    class Result
      include Dry::Monads[:result]

      # Success factory
      def self.success(value = nil)
        Success(value)
      end

      # Failure factory
      def self.failure(error)
        Failure(error)
      end

      # Validation failure
      def self.validation_error(message, details = {})
        Failure({ type: :validation_error, message: message, details: details })
      end

      # Not found failure
      def self.not_found(resource, id = nil)
        message = id ? "#{resource} with id #{id} not found" : "#{resource} not found"
        Failure({ type: :not_found, message: message })
      end

      # Server error
      def self.server_error(message)
        Failure({ type: :server_error, message: message })
      end
    end
  end
end
