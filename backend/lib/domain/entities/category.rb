module Domain
  module Entities
    class Category
      attr_reader :id, :name, :slug, :created_at

      def initialize(id:, name:, slug:, created_at: nil)
        @id = id
        @name = name
        @slug = slug
        @created_at = created_at
      end

      def to_h
        {
          id: @id,
          name: @name,
          slug: @slug
        }
      end
    end
  end
end
