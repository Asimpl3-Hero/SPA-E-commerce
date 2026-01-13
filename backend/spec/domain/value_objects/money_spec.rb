require 'spec_helper'

RSpec.describe Domain::ValueObjects::Money do
  describe '#initialize' do
    it 'creates money object with valid amount' do
      money = described_class.new(100.50)
      expect(money.amount).to eq(100.50)
    end

    it 'rounds amount to 2 decimal places' do
      money = described_class.new(100.556)
      expect(money.amount).to eq(100.56)
    end

    it 'accepts integer amounts' do
      money = described_class.new(100)
      expect(money.amount).to eq(100)
    end

    it 'raises error for non-numeric amount' do
      expect {
        described_class.new('invalid')
      }.to raise_error(ArgumentError, 'Amount must be a number')
    end

    it 'raises error for negative amount' do
      expect {
        described_class.new(-10)
      }.to raise_error(ArgumentError, 'Amount cannot be negative')
    end

    it 'accepts zero as valid amount' do
      money = described_class.new(0)
      expect(money.amount).to eq(0)
    end
  end

  describe '#to_f' do
    it 'converts to float' do
      money = described_class.new(100.50)
      expect(money.to_f).to eq(100.50)
      expect(money.to_f).to be_a(Float)
    end
  end

  describe '#to_s' do
    it 'formats to string with 2 decimal places' do
      money = described_class.new(100.5)
      expect(money.to_s).to eq('100.50')
    end

    it 'formats integer amounts with 2 decimal places' do
      money = described_class.new(100)
      expect(money.to_s).to eq('100.00')
    end
  end

  describe '#>' do
    it 'returns true when amount is greater' do
      money1 = described_class.new(100)
      money2 = described_class.new(50)
      expect(money1 > money2).to be(true)
    end

    it 'returns false when amount is less' do
      money1 = described_class.new(50)
      money2 = described_class.new(100)
      expect(money1 > money2).to be(false)
    end

    it 'returns false when amounts are equal' do
      money1 = described_class.new(100)
      money2 = described_class.new(100)
      expect(money1 > money2).to be(false)
    end
  end

  describe '#<' do
    it 'returns true when amount is less' do
      money1 = described_class.new(50)
      money2 = described_class.new(100)
      expect(money1 < money2).to be(true)
    end

    it 'returns false when amount is greater' do
      money1 = described_class.new(100)
      money2 = described_class.new(50)
      expect(money1 < money2).to be(false)
    end

    it 'returns false when amounts are equal' do
      money1 = described_class.new(100)
      money2 = described_class.new(100)
      expect(money1 < money2).to be(false)
    end
  end

  describe '#==' do
    it 'returns true when amounts are equal' do
      money1 = described_class.new(100)
      money2 = described_class.new(100)
      expect(money1 == money2).to be(true)
    end

    it 'returns false when amounts are different' do
      money1 = described_class.new(100)
      money2 = described_class.new(50)
      expect(money1 == money2).to be(false)
    end

    it 'compares rounded values' do
      money1 = described_class.new(100.556)
      money2 = described_class.new(100.559)
      expect(money1 == money2).to be(true)
    end
  end
end
