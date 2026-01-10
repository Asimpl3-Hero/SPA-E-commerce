module Domain
  module Entities
    class Product
      attr_reader :id, :name, :price, :original_price, :rating, :reviews,
                  :category, :description, :image, :badge_text, :badge_variant,
                  :created_at, :updated_at

      def initialize(
        id:,
        name:,
        price:,
        category:,
        description:,
        image:,
        original_price: nil,
        rating: 0.0,
        reviews: 0,
        badge_text: nil,
        badge_variant: nil,
        created_at: nil,
        updated_at: nil
      )
        @id = id
        @name = name
        @price = price
        @original_price = original_price
        @rating = rating
        @reviews = reviews
        @category = category
        @description = description
        @image = image
        @badge_text = badge_text
        @badge_variant = badge_variant
        @created_at = created_at
        @updated_at = updated_at
      end

      def to_h
        {
          id: @id,
          name: @name,
          price: @price,
          originalPrice: @original_price,
          rating: @rating,
          reviews: @reviews,
          category: @category,
          description: @description,
          image: @image,
          badge: badge_present? ? { text: @badge_text, variant: @badge_variant } : nil
        }.compact
      end

      def has_discount?
        !@original_price.nil? && @original_price > @price
      end

      def discount_percentage
        return 0 unless has_discount?
        ((@original_price - @price) / @original_price * 100).round
      end

      private

      def badge_present?
        @badge_text && @badge_variant
      end
    end
  end
end
