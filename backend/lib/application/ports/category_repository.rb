module Application
  module Ports
    class CategoryRepository
      def find_all
        raise NotImplementedError
      end

      def find_by_id(id)
        raise NotImplementedError
      end

      def find_by_slug(slug)
        raise NotImplementedError
      end

      def create(category_data)
        raise NotImplementedError
      end
    end
  end
end
