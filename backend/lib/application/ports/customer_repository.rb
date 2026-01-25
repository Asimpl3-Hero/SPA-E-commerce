module Application
  module Ports
    class CustomerRepository
      def find_by_id(id)
        raise NotImplementedError
      end

      def find_by_email(email)
        raise NotImplementedError
      end

      def create(customer_data)
        raise NotImplementedError
      end

      def update(id, customer_data)
        raise NotImplementedError
      end

      def create_or_update_by_email(customer_data)
        raise NotImplementedError
      end
    end
  end
end
