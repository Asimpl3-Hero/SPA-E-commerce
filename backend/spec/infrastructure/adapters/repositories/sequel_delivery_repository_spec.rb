require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/repositories/sequel_delivery_repository'

RSpec.describe Infrastructure::Adapters::Repositories::SequelDeliveryRepository, db: true do
  let(:db) { Sequel.sqlite }
  let(:repository) { described_class.new(db) }

  before do
    db.create_table :deliveries do
      primary_key :id
      String :address_line_1, null: false
      String :address_line_2
      String :city, null: false
      String :region, null: false
      String :country, null: false
      String :postal_code
      String :phone_number
      String :delivery_notes
      String :status, default: 'pending'
      Time :estimated_delivery_date
      Time :created_at
      Time :updated_at
    end
  end

  after do
    db.drop_table?(:deliveries)
  end

  describe '#find_by_id' do
    context 'when delivery exists' do
      before do
        db[:deliveries].insert(
          address_line_1: 'Calle 123 #45-67',
          city: 'Bogota',
          region: 'Cundinamarca',
          country: 'CO',
          status: 'pending',
          created_at: Time.now,
          updated_at: Time.now
        )
      end

      it 'returns the delivery' do
        delivery = repository.find_by_id(1)

        expect(delivery).to be_a(Domain::Entities::Delivery)
        expect(delivery.address_line_1).to eq('Calle 123 #45-67')
        expect(delivery.city).to eq('Bogota')
      end
    end

    context 'when delivery does not exist' do
      it 'returns nil' do
        delivery = repository.find_by_id(999)
        expect(delivery).to be_nil
      end
    end
  end

  describe '#create' do
    it 'creates a new delivery' do
      expect {
        repository.create(
          address_line_1: 'Carrera 10 #20-30',
          city: 'Medellin',
          region: 'Antioquia',
          country: 'CO'
        )
      }.to change { db[:deliveries].count }.by(1)
    end

    it 'returns the created delivery' do
      delivery = repository.create(
        address_line_1: 'Carrera 10 #20-30',
        address_line_2: 'Apt 501',
        city: 'Medellin',
        region: 'Antioquia',
        country: 'CO',
        postal_code: '050001',
        phone_number: '3001234567',
        delivery_notes: 'Ring twice'
      )

      expect(delivery).to be_a(Domain::Entities::Delivery)
      expect(delivery.id).not_to be_nil
      expect(delivery.address_line_1).to eq('Carrera 10 #20-30')
      expect(delivery.address_line_2).to eq('Apt 501')
      expect(delivery.status).to eq('pending')
    end

    it 'sets default status to pending' do
      delivery = repository.create(
        address_line_1: 'Calle 1',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO'
      )

      expect(delivery.status).to eq('pending')
    end
  end

  describe '#update' do
    before do
      db[:deliveries].insert(
        address_line_1: 'Calle Original',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'pending',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates the delivery' do
      delivery = repository.update(1, address_line_1: 'Calle Actualizada')

      expect(delivery.address_line_1).to eq('Calle Actualizada')
    end

    it 'persists the changes' do
      repository.update(1, city: 'Cali')

      updated = repository.find_by_id(1)
      expect(updated.city).to eq('Cali')
    end
  end

  describe '#update_status' do
    before do
      db[:deliveries].insert(
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'pending',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates the status' do
      delivery = repository.update_status(1, 'assigned')

      expect(delivery.status).to eq('assigned')
    end

    it 'updates status with estimated delivery date' do
      estimated_date = Time.now + (3 * 24 * 60 * 60)
      delivery = repository.update_status(1, 'in_transit', estimated_delivery_date: estimated_date)

      expect(delivery.status).to eq('in_transit')
      expect(delivery.estimated_delivery_date).not_to be_nil
    end

    it 'persists the status change' do
      repository.update_status(1, 'delivered')

      updated = repository.find_by_id(1)
      expect(updated.status).to eq('delivered')
    end
  end
end
