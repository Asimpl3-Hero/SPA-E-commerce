require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/repositories/sequel_transaction_repository'

RSpec.describe Infrastructure::Adapters::Repositories::SequelTransactionRepository, db: true do
  let(:db) { Sequel.sqlite }
  let(:repository) { described_class.new(db) }

  before do
    db.create_table :transactions do
      primary_key :id
      String :wompi_transaction_id
      String :reference, null: false
      Integer :amount_in_cents, null: false
      String :currency, default: 'COP'
      String :status, null: false
      String :payment_method_type, null: false
      String :payment_method_token
      String :payment_data
      Time :created_at
      Time :updated_at
    end
  end

  after do
    db.drop_table?(:transactions)
  end

  describe '#find_by_id' do
    context 'when transaction exists' do
      before do
        db[:transactions].insert(
          wompi_transaction_id: 'wompi-123',
          reference: 'ORDER-123',
          amount_in_cents: 10000,
          currency: 'COP',
          status: 'APPROVED',
          payment_method_type: 'CARD',
          created_at: Time.now,
          updated_at: Time.now
        )
      end

      it 'returns the transaction' do
        transaction = repository.find_by_id(1)

        expect(transaction).to be_a(Domain::Entities::Transaction)
        expect(transaction.reference).to eq('ORDER-123')
        expect(transaction.status).to eq('APPROVED')
      end
    end

    context 'when transaction does not exist' do
      it 'returns nil' do
        transaction = repository.find_by_id(999)
        expect(transaction).to be_nil
      end
    end
  end

  describe '#find_by_wompi_id' do
    before do
      db[:transactions].insert(
        wompi_transaction_id: 'wompi-456',
        reference: 'ORDER-456',
        amount_in_cents: 20000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'NEQUI',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    context 'when transaction exists' do
      it 'returns the transaction' do
        transaction = repository.find_by_wompi_id('wompi-456')

        expect(transaction).to be_a(Domain::Entities::Transaction)
        expect(transaction.reference).to eq('ORDER-456')
      end
    end

    context 'when transaction does not exist' do
      it 'returns nil' do
        transaction = repository.find_by_wompi_id('nonexistent')
        expect(transaction).to be_nil
      end
    end
  end

  describe '#find_by_reference' do
    before do
      db[:transactions].insert(
        reference: 'ORDER-789',
        amount_in_cents: 30000,
        currency: 'COP',
        status: 'DECLINED',
        payment_method_type: 'CARD',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    context 'when transaction exists' do
      it 'returns the transaction' do
        transaction = repository.find_by_reference('ORDER-789')

        expect(transaction).to be_a(Domain::Entities::Transaction)
        expect(transaction.status).to eq('DECLINED')
      end
    end

    context 'when transaction does not exist' do
      it 'returns nil' do
        transaction = repository.find_by_reference('NONEXISTENT')
        expect(transaction).to be_nil
      end
    end
  end

  describe '#create' do
    it 'creates a new transaction' do
      expect {
        repository.create(
          wompi_transaction_id: 'wompi-new',
          reference: 'ORDER-NEW',
          amount_in_cents: 15000,
          currency: 'COP',
          status: 'PENDING',
          payment_method_type: 'CARD',
          payment_method_token: 'tok_123'
        )
      }.to change { db[:transactions].count }.by(1)
    end

    it 'returns the created transaction' do
      transaction = repository.create(
        wompi_transaction_id: 'wompi-new',
        reference: 'ORDER-NEW',
        amount_in_cents: 15000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'CARD'
      )

      expect(transaction).to be_a(Domain::Entities::Transaction)
      expect(transaction.id).not_to be_nil
      expect(transaction.wompi_transaction_id).to eq('wompi-new')
    end

    it 'stores payment_data as JSON' do
      payment_data = { id: 'wompi-123', status: 'APPROVED', extra: 'data' }

      transaction = repository.create(
        reference: 'ORDER-JSON',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'APPROVED',
        payment_method_type: 'CARD',
        payment_data: payment_data
      )

      expect(transaction.payment_data).to be_a(Hash)
      expect(transaction.payment_data[:id]).to eq('wompi-123')
    end
  end

  describe '#update' do
    before do
      db[:transactions].insert(
        wompi_transaction_id: 'wompi-update',
        reference: 'ORDER-UPDATE',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'CARD',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates the transaction' do
      transaction = repository.update(1, status: 'APPROVED')

      expect(transaction.status).to eq('APPROVED')
    end

    it 'persists the changes' do
      repository.update(1, status: 'DECLINED')

      updated = repository.find_by_id(1)
      expect(updated.status).to eq('DECLINED')
    end
  end

  describe '#update_status' do
    before do
      db[:transactions].insert(
        wompi_transaction_id: 'wompi-status',
        reference: 'ORDER-STATUS',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'PENDING',
        payment_method_type: 'CARD',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates the status' do
      transaction = repository.update_status(1, 'APPROVED')

      expect(transaction.status).to eq('APPROVED')
    end

    it 'updates status with payment data' do
      payment_data = { id: 'wompi-status', status: 'APPROVED', final: true }
      transaction = repository.update_status(1, 'APPROVED', payment_data: payment_data)

      expect(transaction.status).to eq('APPROVED')
      expect(transaction.payment_data[:final]).to be(true)
    end
  end
end
