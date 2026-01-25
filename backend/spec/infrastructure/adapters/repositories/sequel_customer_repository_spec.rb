require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/repositories/sequel_customer_repository'

RSpec.describe Infrastructure::Adapters::Repositories::SequelCustomerRepository, db: true do
  let(:db) { Sequel.sqlite }
  let(:repository) { described_class.new(db) }

  before do
    db.create_table :customers do
      primary_key :id
      String :email, null: false
      String :full_name, null: false
      String :phone_number
      Time :created_at
      Time :updated_at
    end
  end

  after do
    db.drop_table?(:customers)
  end

  describe '#find_by_id' do
    context 'when customer exists' do
      before do
        db[:customers].insert(
          email: 'test@example.com',
          full_name: 'John Doe',
          phone_number: '3001234567',
          created_at: Time.now,
          updated_at: Time.now
        )
      end

      it 'returns the customer' do
        customer = repository.find_by_id(1)

        expect(customer).to be_a(Domain::Entities::Customer)
        expect(customer.email).to eq('test@example.com')
        expect(customer.full_name).to eq('John Doe')
      end
    end

    context 'when customer does not exist' do
      it 'returns nil' do
        customer = repository.find_by_id(999)
        expect(customer).to be_nil
      end
    end
  end

  describe '#find_by_email' do
    before do
      db[:customers].insert(
        email: 'test@example.com',
        full_name: 'John Doe',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    context 'when customer exists' do
      it 'returns the customer' do
        customer = repository.find_by_email('test@example.com')

        expect(customer).to be_a(Domain::Entities::Customer)
        expect(customer.full_name).to eq('John Doe')
      end
    end

    context 'when customer does not exist' do
      it 'returns nil' do
        customer = repository.find_by_email('nonexistent@example.com')
        expect(customer).to be_nil
      end
    end
  end

  describe '#create' do
    it 'creates a new customer' do
      expect {
        repository.create(
          email: 'new@example.com',
          full_name: 'New User',
          phone_number: '3009876543'
        )
      }.to change { db[:customers].count }.by(1)
    end

    it 'returns the created customer' do
      customer = repository.create(
        email: 'new@example.com',
        full_name: 'New User',
        phone_number: '3009876543'
      )

      expect(customer).to be_a(Domain::Entities::Customer)
      expect(customer.id).not_to be_nil
      expect(customer.email).to eq('new@example.com')
    end
  end

  describe '#update' do
    before do
      db[:customers].insert(
        email: 'test@example.com',
        full_name: 'John Doe',
        phone_number: '3001234567',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates the customer' do
      customer = repository.update(1, full_name: 'Jane Doe')

      expect(customer.full_name).to eq('Jane Doe')
    end

    it 'persists the changes' do
      repository.update(1, full_name: 'Jane Doe')

      updated = repository.find_by_id(1)
      expect(updated.full_name).to eq('Jane Doe')
    end
  end

  describe '#create_or_update_by_email' do
    context 'when customer does not exist' do
      it 'creates a new customer' do
        expect {
          repository.create_or_update_by_email(
            email: 'new@example.com',
            full_name: 'New User',
            phone_number: '3001234567'
          )
        }.to change { db[:customers].count }.by(1)
      end

      it 'returns the created customer' do
        customer = repository.create_or_update_by_email(
          email: 'new@example.com',
          full_name: 'New User'
        )

        expect(customer.email).to eq('new@example.com')
        expect(customer.full_name).to eq('New User')
      end
    end

    context 'when customer exists' do
      before do
        db[:customers].insert(
          email: 'existing@example.com',
          full_name: 'Old Name',
          phone_number: '3001111111',
          created_at: Time.now,
          updated_at: Time.now
        )
      end

      it 'does not create a new customer' do
        expect {
          repository.create_or_update_by_email(
            email: 'existing@example.com',
            full_name: 'Updated Name',
            phone_number: '3002222222'
          )
        }.not_to change { db[:customers].count }
      end

      it 'updates the existing customer' do
        customer = repository.create_or_update_by_email(
          email: 'existing@example.com',
          full_name: 'Updated Name',
          phone_number: '3002222222'
        )

        expect(customer.full_name).to eq('Updated Name')
        expect(customer.phone_number).to eq('3002222222')
      end
    end
  end
end
