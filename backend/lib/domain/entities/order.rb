module Domain
  module Entities
    class Order
      STATUSES = %w[pending processing approved declined voided error cancelled].freeze

      attr_reader :id, :reference, :customer_id, :delivery_id, :transaction_id,
                  :amount_in_cents, :currency, :status, :items,
                  :created_at, :updated_at

      def initialize(
        id:,
        reference:,
        amount_in_cents:,
        currency:,
        status:,
        items:,
        customer_id: nil,
        delivery_id: nil,
        transaction_id: nil,
        created_at: nil,
        updated_at: nil
      )
        @id = id
        @reference = reference
        @customer_id = customer_id
        @delivery_id = delivery_id
        @transaction_id = transaction_id
        @amount_in_cents = amount_in_cents
        @currency = currency
        @status = status
        @items = items
        @created_at = created_at
        @updated_at = updated_at
      end

      def to_h
        {
          id: @id,
          reference: @reference,
          customer_id: @customer_id,
          delivery_id: @delivery_id,
          transaction_id: @transaction_id,
          amount_in_cents: @amount_in_cents,
          currency: @currency,
          status: @status,
          items: @items,
          created_at: @created_at,
          updated_at: @updated_at
        }.compact
      end

      def pending?
        @status == 'pending'
      end

      def approved?
        @status == 'approved'
      end

      def processing?
        @status == 'processing'
      end

      def paid?
        @status == 'approved'
      end

      def can_be_cancelled?
        %w[pending processing].include?(@status)
      end

      def amount_in_currency
        @amount_in_cents.to_f / 100
      end

      def total_items_count
        return 0 unless @items.is_a?(Array)
        @items.sum { |item| item[:quantity] || 0 }
      end

      def self.generate_reference
        "ORDER-#{Time.now.to_i}-#{rand(1000..9999)}"
      end

      def self.map_wompi_status(wompi_status)
        case wompi_status
        when 'APPROVED'
          'approved'
        when 'DECLINED'
          'declined'
        when 'VOIDED'
          'voided'
        when 'ERROR'
          'error'
        when 'PENDING'
          'processing'
        else
          'pending'
        end
      end
    end
  end
end
