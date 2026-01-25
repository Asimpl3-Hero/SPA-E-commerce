require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/repositories/sequel_order_repository'

RSpec.describe Infrastructure::Adapters::Repositories::SequelOrderRepository, db: true do
  let(:db) { Sequel.sqlite }
  let(:repository) { described_class.new(db) }

  before do
    # Create all required tables
    db.create_table :customers do
      primary_key :id
      String :email
      String :full_name
      String :phone_number
      Time :created_at
      Time :updated_at
    end

    db.create_table :deliveries do
      primary_key :id
      String :address_line_1
      String :address_line_2
      String :city
      String :region
      String :country
      String :postal_code
      String :status
      Time :created_at
      Time :updated_at
    end

    db.create_table :transactions do
      primary_key :id
      String :wompi_transaction_id
      String :reference
      Integer :amount_in_cents
      String :currency
      String :status
      String :payment_method_type
      Time :created_at
      Time :updated_at
    end

    db.create_table :orders do
      primary_key :id
      String :reference, null: false
      Integer :customer_id
      Integer :delivery_id
      Integer :transaction_id
      Integer :amount_in_cents, null: false
      String :currency, default: 'COP'
      String :status, default: 'pending'
      String :items
      Time :created_at
      Time :updated_at
    end
  end

  after do
    db.drop_table?(:orders)
    db.drop_table?(:transactions)
    db.drop_table?(:deliveries)
    db.drop_table?(:customers)
  end

  describe '#find_by_id' do
    context 'when order exists' do
      before do
        db[:orders].insert(
          reference: 'ORDER-123',
          amount_in_cents: 10000,
          currency: 'COP',
          status: 'pending',
          items: '[{"product_id":1,"quantity":2}]',
          created_at: Time.now,
          updated_at: Time.now
        )
      end

      it 'returns the order' do
        order = repository.find_by_id(1)

        expect(order).to be_a(Domain::Entities::Order)
        expect(order.reference).to eq('ORDER-123')
        expect(order.amount_in_cents).to eq(10000)
      end

      it 'parses items JSON' do
        order = repository.find_by_id(1)

        expect(order.items).to be_an(Array)
        expect(order.items.first[:product_id]).to eq(1)
      end
    end

    context 'when order does not exist' do
      it 'returns nil' do
        order = repository.find_by_id(999)
        expect(order).to be_nil
      end
    end
  end

  describe '#find_by_reference' do
    before do
      db[:orders].insert(
        reference: 'ORDER-456',
        amount_in_cents: 20000,
        currency: 'COP',
        status: 'approved',
        items: '[]',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    context 'when order exists' do
      it 'returns the order' do
        order = repository.find_by_reference('ORDER-456')

        expect(order).to be_a(Domain::Entities::Order)
        expect(order.status).to eq('approved')
      end
    end

    context 'when order does not exist' do
      it 'returns nil' do
        order = repository.find_by_reference('NONEXISTENT')
        expect(order).to be_nil
      end
    end
  end

  describe '#find_with_details' do
    before do
      # Create related records
      customer_id = db[:customers].insert(
        email: 'customer@test.com',
        full_name: 'Test Customer',
        phone_number: '3001234567',
        created_at: Time.now,
        updated_at: Time.now
      )

      delivery_id = db[:deliveries].insert(
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        status: 'pending',
        created_at: Time.now,
        updated_at: Time.now
      )

      transaction_id = db[:transactions].insert(
        wompi_transaction_id: 'wompi-detail',
        reference: 'ORDER-DETAIL',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD',
        created_at: Time.now,
        updated_at: Time.now
      )

      db[:orders].insert(
        reference: 'ORDER-DETAIL',
        customer_id: customer_id,
        delivery_id: delivery_id,
        transaction_id: transaction_id,
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'approved',
        items: '[{"product_id":1,"quantity":1}]',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    context 'when order exists with all relations' do
      it 'returns order with customer details' do
        result = repository.find_with_details('ORDER-DETAIL')

        expect(result[:customer]).not_to be_nil
        expect(result[:customer][:email]).to eq('customer@test.com')
        expect(result[:customer][:full_name]).to eq('Test Customer')
      end

      it 'returns order with delivery details' do
        result = repository.find_with_details('ORDER-DETAIL')

        expect(result[:delivery]).not_to be_nil
        expect(result[:delivery][:address_line_1]).to eq('Calle 123')
        expect(result[:delivery][:city]).to eq('Bogota')
      end

      it 'returns order with transaction details' do
        result = repository.find_with_details('ORDER-DETAIL')

        expect(result[:transaction]).not_to be_nil
        expect(result[:transaction][:wompi_transaction_id]).to eq('wompi-detail')
        expect(result[:transaction][:status]).to eq('APPROVED')
      end

      it 'returns order data' do
        result = repository.find_with_details('ORDER-DETAIL')

        expect(result[:order]).not_to be_nil
        expect(result[:order][:reference]).to eq('ORDER-DETAIL')
        expect(result[:order][:status]).to eq('approved')
      end
    end

    context 'when order does not exist' do
      it 'returns nil' do
        result = repository.find_with_details('NONEXISTENT')
        expect(result).to be_nil
      end
    end
  end

  describe '#create' do
    it 'creates a new order' do
      expect {
        repository.create(
          reference: 'ORDER-NEW',
          amount_in_cents: 15000,
          currency: 'COP',
          status: 'pending',
          items: [{ product_id: 1, quantity: 2 }]
        )
      }.to change { db[:orders].count }.by(1)
    end

    it 'returns the created order' do
      order = repository.create(
        reference: 'ORDER-CREATE',
        customer_id: nil,
        amount_in_cents: 15000,
        currency: 'COP',
        status: 'pending',
        items: [{ product_id: 1, quantity: 2 }]
      )

      expect(order).to be_a(Domain::Entities::Order)
      expect(order.id).not_to be_nil
      expect(order.reference).to eq('ORDER-CREATE')
    end

    it 'generates reference if not provided' do
      order = repository.create(
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: []
      )

      expect(order.reference).to start_with('ORDER-')
    end

    it 'stores items as JSON' do
      items = [{ product_id: 1, quantity: 2 }, { product_id: 2, quantity: 1 }]

      order = repository.create(
        reference: 'ORDER-ITEMS',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: items
      )

      expect(order.items).to be_an(Array)
      expect(order.items.length).to eq(2)
    end
  end

  describe '#update' do
    before do
      db[:orders].insert(
        reference: 'ORDER-UPDATE',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: '[]',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates the order' do
      order = repository.update(1, status: 'approved')

      expect(order.status).to eq('approved')
    end

    it 'persists the changes' do
      repository.update(1, status: 'declined')

      updated = repository.find_by_id(1)
      expect(updated.status).to eq('declined')
    end
  end

  describe '#update_status' do
    before do
      db[:orders].insert(
        reference: 'ORDER-STATUS',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: '[]',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates the status' do
      order = repository.update_status(1, 'processing')

      expect(order.status).to eq('processing')
    end
  end

  describe '#update_transaction' do
    before do
      db[:orders].insert(
        reference: 'ORDER-TRANS',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'pending',
        items: '[]',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates transaction_id and status' do
      order = repository.update_transaction(1, 100, 'approved')

      expect(order.transaction_id).to eq(100)
      expect(order.status).to eq('approved')
    end
  end
end
