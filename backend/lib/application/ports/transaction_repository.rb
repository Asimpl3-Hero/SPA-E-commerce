module Application
  module Ports
    class TransactionRepository
      def find_by_id(id)
        raise NotImplementedError
      end

      def find_by_wompi_id(wompi_transaction_id)
        raise NotImplementedError
      end

      def find_by_reference(reference)
        raise NotImplementedError
      end

      def create(transaction_data)
        raise NotImplementedError
      end

      def update(id, transaction_data)
        raise NotImplementedError
      end

      def update_status(id, status, payment_data: nil)
        raise NotImplementedError
      end
    end
  end
end
