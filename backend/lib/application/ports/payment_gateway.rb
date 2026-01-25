module Application
  module Ports
    class PaymentGateway
      def get_acceptance_token
        raise NotImplementedError
      end

      def create_transaction(params)
        raise NotImplementedError
      end

      def get_transaction(transaction_id)
        raise NotImplementedError
      end

      def validate_webhook_signature(payload, signature, timestamp)
        raise NotImplementedError
      end
    end
  end
end
