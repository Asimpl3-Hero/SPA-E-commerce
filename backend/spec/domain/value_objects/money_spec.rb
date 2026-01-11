# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Domain::ValueObjects::Money do
  describe '#initialize' do
    context 'with valid amount' do
      it 'accepts integer amounts' do
        money = described_class.new(100)
        expect(money.amount).to eq(100)
      end

      it 'accepts float amounts' do
        money = described_class.new(99.99)
        expect(money.amount).to eq(99.99)
      end

      it 'accepts zero' do
        money = described_class.new(0)
        expect(money.amount).to eq(0)
      end

      it 'rounds to 2 decimal places' do
        money = described_class.new(99.999)
        expect(money.amount).to eq(100.0)
      end

      it 'rounds 99.995 to 100.0' do
        money = described_class.new(99.995)
        expect(money.amount).to eq(100.0)
      end

      it 'rounds 99.994 to 99.99' do
        money = described_class.new(99.994)
        expect(money.amount).to eq(99.99)
      end
    end

    context 'with invalid amount' do
      it 'raises error for negative amounts' do
        expect {
          described_class.new(-10)
        }.to raise_error(ArgumentError, 'Amount cannot be negative')
      end

      it 'raises error for string amounts' do
        expect {
          described_class.new('100')
        }.to raise_error(ArgumentError, 'Amount must be a number')
      end

      it 'raises error for nil' do
        expect {
          described_class.new(nil)
        }.to raise_error(ArgumentError, 'Amount must be a number')
      end

      it 'raises error for array' do
        expect {
          described_class.new([100])
        }.to raise_error(ArgumentError, 'Amount must be a number')
      end

      it 'raises error for hash' do
        expect {
          described_class.new({ amount: 100 })
        }.to raise_error(ArgumentError, 'Amount must be a number')
      end
    end
  end

  describe '#to_f' do
    it 'returns amount as float' do
      money = described_class.new(100)
      expect(money.to_f).to eq(100.0)
      expect(money.to_f).to be_a(Float)
    end

    it 'converts integer to float' do
      money = described_class.new(50)
      expect(money.to_f).to eq(50.0)
    end
  end

  describe '#to_s' do
    it 'formats amount with 2 decimal places' do
      money = described_class.new(99.99)
      expect(money.to_s).to eq('99.99')
    end

    it 'formats integer with 2 decimal places' do
      money = described_class.new(100)
      expect(money.to_s).to eq('100.00')
    end

    it 'formats zero with 2 decimal places' do
      money = described_class.new(0)
      expect(money.to_s).to eq('0.00')
    end

    it 'formats large amounts correctly' do
      money = described_class.new(1234567.89)
      expect(money.to_s).to eq('1234567.89')
    end
  end

  describe '#>' do
    it 'returns true when amount is greater' do
      money1 = described_class.new(100)
      money2 = described_class.new(50)

      expect(money1 > money2).to be true
    end

    it 'returns false when amount is less' do
      money1 = described_class.new(50)
      money2 = described_class.new(100)

      expect(money1 > money2).to be false
    end

    it 'returns false when amounts are equal' do
      money1 = described_class.new(100)
      money2 = described_class.new(100)

      expect(money1 > money2).to be false
    end
  end

  describe '#<' do
    it 'returns true when amount is less' do
      money1 = described_class.new(50)
      money2 = described_class.new(100)

      expect(money1 < money2).to be true
    end

    it 'returns false when amount is greater' do
      money1 = described_class.new(100)
      money2 = described_class.new(50)

      expect(money1 < money2).to be false
    end

    it 'returns false when amounts are equal' do
      money1 = described_class.new(100)
      money2 = described_class.new(100)

      expect(money1 < money2).to be false
    end
  end

  describe '#==' do
    it 'returns true when amounts are equal' do
      money1 = described_class.new(100)
      money2 = described_class.new(100)

      expect(money1 == money2).to be true
    end

    it 'returns false when amounts are different' do
      money1 = described_class.new(100)
      money2 = described_class.new(99)

      expect(money1 == money2).to be false
    end

    it 'compares float and integer amounts correctly' do
      money1 = described_class.new(100)
      money2 = described_class.new(100.0)

      expect(money1 == money2).to be true
    end

    it 'handles rounding in comparison' do
      money1 = described_class.new(99.999)
      money2 = described_class.new(100.0)

      expect(money1 == money2).to be true
    end
  end

  describe 'comparison combinations' do
    let(:small) { described_class.new(50) }
    let(:medium) { described_class.new(100) }
    let(:large) { described_class.new(150) }

    it 'chains comparisons correctly' do
      expect(small < medium).to be true
      expect(medium < large).to be true
      expect(small < large).to be true
    end

    it 'verifies ordering' do
      expect(large > medium).to be true
      expect(medium > small).to be true
      expect(large > small).to be true
    end
  end

  describe 'attr_reader' do
    let(:money) { described_class.new(100) }

    it 'provides read access to amount' do
      expect(money).to respond_to(:amount)
      expect(money.amount).to eq(100)
    end

    it 'does not provide write access' do
      expect(money).not_to respond_to(:amount=)
    end
  end

  describe 'edge cases' do
    it 'handles very small amounts' do
      money = described_class.new(0.01)
      expect(money.amount).to eq(0.01)
      expect(money.to_s).to eq('0.01')
    end

    it 'handles very large amounts' do
      money = described_class.new(999999999.99)
      expect(money.amount).to eq(999999999.99)
    end

    it 'handles amounts with many decimals' do
      money = described_class.new(123.456789)
      expect(money.amount).to eq(123.46)
    end
  end
end
