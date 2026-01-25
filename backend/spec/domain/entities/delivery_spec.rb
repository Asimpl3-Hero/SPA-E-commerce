require 'spec_helper'
require_relative '../../../lib/domain/entities/delivery'

RSpec.describe Domain::Entities::Delivery do
  describe '#initialize' do
    it 'creates a delivery with required attributes' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123 #45-67',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO'
      )

      expect(delivery.id).to eq(1)
      expect(delivery.address_line_1).to eq('Calle 123 #45-67')
      expect(delivery.city).to eq('Bogota')
      expect(delivery.region).to eq('Cundinamarca')
      expect(delivery.country).to eq('CO')
    end

    it 'creates a delivery with all attributes' do
      now = Time.now
      estimated = now + (3 * 24 * 60 * 60)

      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123 #45-67',
        address_line_2: 'Apt 101',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        postal_code: '110111',
        phone_number: '3001234567',
        delivery_notes: 'Leave at door',
        status: 'assigned',
        estimated_delivery_date: estimated,
        created_at: now,
        updated_at: now
      )

      expect(delivery.address_line_2).to eq('Apt 101')
      expect(delivery.postal_code).to eq('110111')
      expect(delivery.phone_number).to eq('3001234567')
      expect(delivery.delivery_notes).to eq('Leave at door')
      expect(delivery.status).to eq('assigned')
      expect(delivery.estimated_delivery_date).to eq(estimated)
    end

    it 'defaults status to pending' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO'
      )

      expect(delivery.status).to eq('pending')
    end
  end

  describe '#to_h' do
    it 'returns a hash representation' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123 #45-67',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'pending'
      )

      hash = delivery.to_h

      expect(hash[:id]).to eq(1)
      expect(hash[:address_line_1]).to eq('Calle 123 #45-67')
      expect(hash[:city]).to eq('Bogota')
      expect(hash[:status]).to eq('pending')
    end

    it 'excludes nil values' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO'
      )

      hash = delivery.to_h

      expect(hash).not_to have_key(:address_line_2)
      expect(hash).not_to have_key(:postal_code)
    end
  end

  describe '#full_address' do
    it 'returns full address string' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123 #45-67',
        address_line_2: 'Apt 101',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        postal_code: '110111'
      )

      expect(delivery.full_address).to eq('Calle 123 #45-67, Apt 101, Bogota, Cundinamarca, CO, 110111')
    end

    it 'excludes nil parts' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO'
      )

      expect(delivery.full_address).to eq('Calle 123, Bogota, Cundinamarca, CO')
    end
  end

  describe '#pending?' do
    it 'returns true when status is pending' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'pending'
      )

      expect(delivery.pending?).to be(true)
    end

    it 'returns false when status is not pending' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'assigned'
      )

      expect(delivery.pending?).to be(false)
    end
  end

  describe '#in_transit?' do
    it 'returns true when status is in_transit' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'in_transit'
      )

      expect(delivery.in_transit?).to be(true)
    end
  end

  describe '#delivered?' do
    it 'returns true when status is delivered' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'delivered'
      )

      expect(delivery.delivered?).to be(true)
    end
  end

  describe '#can_be_cancelled?' do
    it 'returns true when status is pending' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'pending'
      )

      expect(delivery.can_be_cancelled?).to be(true)
    end

    it 'returns true when status is assigned' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'assigned'
      )

      expect(delivery.can_be_cancelled?).to be(true)
    end

    it 'returns false when status is in_transit' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'in_transit'
      )

      expect(delivery.can_be_cancelled?).to be(false)
    end

    it 'returns false when status is delivered' do
      delivery = described_class.new(
        id: 1,
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'delivered'
      )

      expect(delivery.can_be_cancelled?).to be(false)
    end
  end
end
