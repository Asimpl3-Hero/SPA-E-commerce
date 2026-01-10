module Domain
  module ValueObjects
    class Money
      attr_reader :amount

      def initialize(amount)
        @amount = validate_amount(amount)
      end

      def to_f
        @amount.to_f
      end

      def to_s
        format('%.2f', @amount)
      end

      def >(other)
        @amount > other.amount
      end

      def <(other)
        @amount < other.amount
      end

      def ==(other)
        @amount == other.amount
      end

      private

      def validate_amount(amount)
        raise ArgumentError, 'Amount must be a number' unless amount.is_a?(Numeric)
        raise ArgumentError, 'Amount cannot be negative' if amount < 0
        amount.round(2)
      end
    end
  end
end
