module Application
  module Ports
    class OrderRepository
      def find_by_id(id)
        raise NotImplementedError
      end

      def find_by_reference(reference)
        raise NotImplementedError
      end

      def find_with_details(reference)
        raise NotImplementedError
      end

      def create(order_data)
        raise NotImplementedError
      end

      def update(id, order_data)
        raise NotImplementedError
      end

      def update_status(id, status)
        raise NotImplementedError
      end

      def update_transaction(id, transaction_id, status)
        raise NotImplementedError
      end
    end
  end
end
