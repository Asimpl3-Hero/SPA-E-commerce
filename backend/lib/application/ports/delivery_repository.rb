module Application
  module Ports
    class DeliveryRepository
      def find_by_id(id)
        raise NotImplementedError
      end

      def create(delivery_data)
        raise NotImplementedError
      end

      def update(id, delivery_data)
        raise NotImplementedError
      end

      def update_status(id, status, estimated_delivery_date: nil)
        raise NotImplementedError
      end
    end
  end
end
