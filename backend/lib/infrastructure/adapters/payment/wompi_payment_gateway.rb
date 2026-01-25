require_relative '../../../application/ports/payment_gateway'
require_relative 'wompi_service'

module Infrastructure
  module Adapters
    module Payment
      class WompiPaymentGateway < Application::Ports::PaymentGateway
        def get_acceptance_token
          WompiService.get_acceptance_token
        end

        def create_transaction(params)
          WompiService.create_transaction(params)
        end

        def get_transaction(transaction_id)
          WompiService.get_transaction(transaction_id)
        end

        def validate_webhook_signature(payload, signature, timestamp)
          WompiService.validate_webhook_signature(payload, signature, timestamp)
        end
      end
    end
  end
end
