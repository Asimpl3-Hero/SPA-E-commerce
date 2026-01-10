module Application
  module Ports
    class ProductRepository
      def find_all(filters: {})
        raise NotImplementedError
      end

      def find_by_id(id)
        raise NotImplementedError
      end

      def find_by_category(category)
        raise NotImplementedError
      end

      def search(query)
        raise NotImplementedError
      end

      def create(product_data)
        raise NotImplementedError
      end

      def update(id, product_data)
        raise NotImplementedError
      end

      def delete(id)
        raise NotImplementedError
      end

      def count
        raise NotImplementedError
      end
    end
  end
end
