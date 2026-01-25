module Domain
  module Entities
    class Delivery
      STATUSES = %w[pending assigned in_transit delivered cancelled].freeze

      attr_reader :id, :address_line_1, :address_line_2, :city, :region, :country,
                  :postal_code, :phone_number, :delivery_notes, :status,
                  :estimated_delivery_date, :created_at, :updated_at

      def initialize(
        id:,
        address_line_1:,
        city:,
        region:,
        country:,
        address_line_2: nil,
        postal_code: nil,
        phone_number: nil,
        delivery_notes: nil,
        status: 'pending',
        estimated_delivery_date: nil,
        created_at: nil,
        updated_at: nil
      )
        @id = id
        @address_line_1 = address_line_1
        @address_line_2 = address_line_2
        @city = city
        @region = region
        @country = country
        @postal_code = postal_code
        @phone_number = phone_number
        @delivery_notes = delivery_notes
        @status = status
        @estimated_delivery_date = estimated_delivery_date
        @created_at = created_at
        @updated_at = updated_at
      end

      def to_h
        {
          id: @id,
          address_line_1: @address_line_1,
          address_line_2: @address_line_2,
          city: @city,
          region: @region,
          country: @country,
          postal_code: @postal_code,
          phone_number: @phone_number,
          delivery_notes: @delivery_notes,
          status: @status,
          estimated_delivery_date: @estimated_delivery_date,
          created_at: @created_at,
          updated_at: @updated_at
        }.compact
      end

      def full_address
        parts = [@address_line_1, @address_line_2, @city, @region, @country, @postal_code]
        parts.compact.reject(&:empty?).join(', ')
      end

      def pending?
        @status == 'pending'
      end

      def in_transit?
        @status == 'in_transit'
      end

      def delivered?
        @status == 'delivered'
      end

      def can_be_cancelled?
        %w[pending assigned].include?(@status)
      end
    end
  end
end
