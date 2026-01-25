require 'spec_helper'
require_relative '../../../lib/domain/entities/transaction'

RSpec.describe Domain::Entities::Transaction do
  describe '#initialize' do
    it 'creates a transaction with required attributes' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123-4567',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD'
      )

      expect(transaction.id).to eq(1)
      expect(transaction.reference).to eq('ORDER-123-4567')
      expect(transaction.amount_in_cents).to eq(10000)
      expect(transaction.currency).to eq('COP')
      expect(transaction.status).to eq('APPROVED')
      expect(transaction.payment_method_type).to eq('CARD')
    end

    it 'creates a transaction with all attributes' do
      now = Time.now
      payment_data = { id: 'wompi-123', status: 'APPROVED' }

      transaction = described_class.new(
        id: 1,
        wompi_transaction_id: 'wompi-123',
        reference: 'ORDER-123-4567',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD',
        payment_method_token: 'tok_test_123',
        payment_data: payment_data,
        created_at: now,
        updated_at: now
      )

      expect(transaction.wompi_transaction_id).to eq('wompi-123')
      expect(transaction.payment_method_token).to eq('tok_test_123')
      expect(transaction.payment_data).to eq(payment_data)
    end
  end

  describe '#to_h' do
    it 'returns a hash representation' do
      transaction = described_class.new(
        id: 1,
        wompi_transaction_id: 'wompi-123',
        reference: 'ORDER-123-4567',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD'
      )

      hash = transaction.to_h

      expect(hash[:id]).to eq(1)
      expect(hash[:wompi_transaction_id]).to eq('wompi-123')
      expect(hash[:reference]).to eq('ORDER-123-4567')
      expect(hash[:amount_in_cents]).to eq(10000)
      expect(hash[:status]).to eq('APPROVED')
    end

    it 'excludes nil values' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'CARD'
      )

      hash = transaction.to_h

      expect(hash).not_to have_key(:wompi_transaction_id)
      expect(hash).not_to have_key(:payment_method_token)
    end
  end

  describe '#approved?' do
    it 'returns true when status is APPROVED' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD'
      )

      expect(transaction.approved?).to be(true)
    end

    it 'returns false when status is not APPROVED' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'CARD'
      )

      expect(transaction.approved?).to be(false)
    end
  end

  describe '#declined?' do
    it 'returns true when status is DECLINED' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'DECLINED',
        payment_method_type: 'CARD'
      )

      expect(transaction.declined?).to be(true)
    end
  end

  describe '#pending?' do
    it 'returns true when status is PENDING' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'CARD'
      )

      expect(transaction.pending?).to be(true)
    end
  end

  describe '#error?' do
    it 'returns true when status is ERROR' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'ERROR',
        payment_method_type: 'CARD'
      )

      expect(transaction.error?).to be(true)
    end
  end

  describe '#final_status?' do
    it 'returns true for APPROVED' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD'
      )

      expect(transaction.final_status?).to be(true)
    end

    it 'returns true for DECLINED' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'DECLINED',
        payment_method_type: 'CARD'
      )

      expect(transaction.final_status?).to be(true)
    end

    it 'returns true for ERROR' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'ERROR',
        payment_method_type: 'CARD'
      )

      expect(transaction.final_status?).to be(true)
    end

    it 'returns true for VOIDED' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'VOIDED',
        payment_method_type: 'CARD'
      )

      expect(transaction.final_status?).to be(true)
    end

    it 'returns false for PENDING' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'CARD'
      )

      expect(transaction.final_status?).to be(false)
    end
  end

  describe '#amount_in_currency' do
    it 'converts cents to currency units' do
      transaction = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 15050,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD'
      )

      expect(transaction.amount_in_currency).to eq(150.5)
    end
  end
end
