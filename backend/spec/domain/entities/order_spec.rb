require 'spec_helper'
require_relative '../../../lib/domain/entities/order'

RSpec.describe Domain::Entities::Order do
  describe '#initialize' do
    it 'creates an order with required attributes' do
      items = [{ product_id: 1, quantity: 2, price: 5000 }]

      order = described_class.new(
        id: 1,
        reference: 'ORDER-123-4567',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: items
      )

      expect(order.id).to eq(1)
      expect(order.reference).to eq('ORDER-123-4567')
      expect(order.amount_in_cents).to eq(10000)
      expect(order.currency).to eq('COP')
      expect(order.status).to eq('pending')
      expect(order.items).to eq(items)
    end

    it 'creates an order with all attributes' do
      now = Time.now
      items = [{ product_id: 1, quantity: 2 }]

      order = described_class.new(
        id: 1,
        reference: 'ORDER-123-4567',
        customer_id: 10,
        delivery_id: 20,
        transaction_id: 30,
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'approved',
        items: items,
        created_at: now,
        updated_at: now
      )

      expect(order.customer_id).to eq(10)
      expect(order.delivery_id).to eq(20)
      expect(order.transaction_id).to eq(30)
      expect(order.created_at).to eq(now)
    end
  end

  describe '#to_h' do
    it 'returns a hash representation' do
      items = [{ product_id: 1, quantity: 2 }]

      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        customer_id: 10,
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: items
      )

      hash = order.to_h

      expect(hash[:id]).to eq(1)
      expect(hash[:reference]).to eq('ORDER-123')
      expect(hash[:customer_id]).to eq(10)
      expect(hash[:amount_in_cents]).to eq(10000)
      expect(hash[:items]).to eq(items)
    end

    it 'excludes nil values' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: []
      )

      hash = order.to_h

      expect(hash).not_to have_key(:delivery_id)
      expect(hash).not_to have_key(:transaction_id)
    end
  end

  describe '#pending?' do
    it 'returns true when status is pending' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: []
      )

      expect(order.pending?).to be(true)
    end

    it 'returns false when status is not pending' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'approved',
        items: []
      )

      expect(order.pending?).to be(false)
    end
  end

  describe '#approved?' do
    it 'returns true when status is approved' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'approved',
        items: []
      )

      expect(order.approved?).to be(true)
    end
  end

  describe '#processing?' do
    it 'returns true when status is processing' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'processing',
        items: []
      )

      expect(order.processing?).to be(true)
    end
  end

  describe '#paid?' do
    it 'returns true when status is approved' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'approved',
        items: []
      )

      expect(order.paid?).to be(true)
    end
  end

  describe '#can_be_cancelled?' do
    it 'returns true when status is pending' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: []
      )

      expect(order.can_be_cancelled?).to be(true)
    end

    it 'returns true when status is processing' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'processing',
        items: []
      )

      expect(order.can_be_cancelled?).to be(true)
    end

    it 'returns false when status is approved' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'approved',
        items: []
      )

      expect(order.can_be_cancelled?).to be(false)
    end
  end

  describe '#amount_in_currency' do
    it 'converts cents to currency units' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 15050,
        currency: 'COP',
        status: 'pending',
        items: []
      )

      expect(order.amount_in_currency).to eq(150.5)
    end
  end

  describe '#total_items_count' do
    it 'returns sum of all item quantities' do
      items = [
        { product_id: 1, quantity: 2 },
        { product_id: 2, quantity: 3 },
        { product_id: 3, quantity: 1 }
      ]

      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: items
      )

      expect(order.total_items_count).to eq(6)
    end

    it 'returns 0 for empty items' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: []
      )

      expect(order.total_items_count).to eq(0)
    end

    it 'returns 0 when items is not an array' do
      order = described_class.new(
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: nil
      )

      expect(order.total_items_count).to eq(0)
    end
  end

  describe '.generate_reference' do
    it 'generates a unique reference starting with ORDER-' do
      reference = described_class.generate_reference

      expect(reference).to start_with('ORDER-')
    end

    it 'generates different references each time' do
      ref1 = described_class.generate_reference
      ref2 = described_class.generate_reference

      expect(ref1).not_to eq(ref2)
    end
  end

  describe '.map_wompi_status' do
    it 'maps APPROVED to approved' do
      expect(described_class.map_wompi_status('APPROVED')).to eq('approved')
    end

    it 'maps DECLINED to declined' do
      expect(described_class.map_wompi_status('DECLINED')).to eq('declined')
    end

    it 'maps VOIDED to voided' do
      expect(described_class.map_wompi_status('VOIDED')).to eq('voided')
    end

    it 'maps ERROR to error' do
      expect(described_class.map_wompi_status('ERROR')).to eq('error')
    end

    it 'maps PENDING to processing' do
      expect(described_class.map_wompi_status('PENDING')).to eq('processing')
    end

    it 'maps unknown status to pending' do
      expect(described_class.map_wompi_status('UNKNOWN')).to eq('pending')
    end
  end
end
