require 'dry-monads'

module Domain
  module ValueObjects
    # Railway Oriented Programming Result type
    class Result
      extend Dry::Monads[:result]
      include Dry::Monads[:result]

      class << self
        # Success factory
        def success(value = nil)
          Success(value)
        end

        # Failure factory
        def failure(error)
          Failure(error)
        end

        # Validation failure
        def validation_error(message, details = {})
          Failure({ type: :validation_error, message: message, details: details })
        end

        # Not found failure
        def not_found(resource, id = nil)
          message = id ? "#{resource} with id #{id} not found" : "#{resource} not found"
          Failure({ type: :not_found, message: message })
        end

        # Server error
        def server_error(message)
          Failure({ type: :server_error, message: message })
        end
      end
    end
  end
end
