module Domain
  module Entities
    class Transaction
      STATUSES = %w[PENDING APPROVED DECLINED VOIDED ERROR].freeze
      PAYMENT_METHODS = %w[CARD NEQUI PSE BANCOLOMBIA_TRANSFER].freeze

      attr_reader :id, :wompi_transaction_id, :reference, :amount_in_cents, :currency,
                  :status, :payment_method_type, :payment_method_token, :payment_data,
                  :created_at, :updated_at

      def initialize(
        id:,
        reference:,
        amount_in_cents:,
        currency:,
        status:,
        payment_method_type:,
        wompi_transaction_id: nil,
        payment_method_token: nil,
        payment_data: nil,
        created_at: nil,
        updated_at: nil
      )
        @id = id
        @wompi_transaction_id = wompi_transaction_id
        @reference = reference
        @amount_in_cents = amount_in_cents
        @currency = currency
        @status = status
        @payment_method_type = payment_method_type
        @payment_method_token = payment_method_token
        @payment_data = payment_data
        @created_at = created_at
        @updated_at = updated_at
      end

      def to_h
        {
          id: @id,
          wompi_transaction_id: @wompi_transaction_id,
          reference: @reference,
          amount_in_cents: @amount_in_cents,
          currency: @currency,
          status: @status,
          payment_method_type: @payment_method_type,
          payment_method_token: @payment_method_token,
          payment_data: @payment_data,
          created_at: @created_at,
          updated_at: @updated_at
        }.compact
      end

      def approved?
        @status == 'APPROVED'
      end

      def declined?
        @status == 'DECLINED'
      end

      def pending?
        @status == 'PENDING'
      end

      def error?
        @status == 'ERROR'
      end

      def final_status?
        %w[APPROVED DECLINED VOIDED ERROR].include?(@status)
      end

      def amount_in_currency
        @amount_in_cents.to_f / 100
      end
    end
  end
end
