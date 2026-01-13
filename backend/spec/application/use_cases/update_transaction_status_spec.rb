require 'spec_helper'
require_relative '../../../lib/application/use_cases/update_transaction_status'
require_relative '../../../lib/infrastructure/adapters/payment/wompi_service'

RSpec.describe Application::UseCases::UpdateTransactionStatus do
  let(:db) { instance_double('Sequel::Database') }
  let(:transactions_dataset) { instance_double('Sequel::Dataset') }
  let(:orders_dataset) { instance_double('Sequel::Dataset') }
  let(:products_dataset) { instance_double('Sequel::Dataset') }
  let(:deliveries_dataset) { instance_double('Sequel::Dataset') }
  let(:use_case) { described_class.new(db) }

  before do
    allow(db).to receive(:[]).with(:transactions).and_return(transactions_dataset)
    allow(db).to receive(:[]).with(:orders).and_return(orders_dataset)
    allow(db).to receive(:[]).with(:products).and_return(products_dataset)
    allow(db).to receive(:[]).with(:deliveries).and_return(deliveries_dataset)
  end

  describe '#execute' do
    let(:transaction_id) { 'txn_123' }
    let(:transaction_record) do
      {
        id: 1,
        wompi_transaction_id: 'txn_123',
        status: 'PENDING',
        reference: 'ORDER-123'
      }
    end
    let(:order_record) do
      {
        id: 1,
        transaction_id: 1,
        items: '[{"product_id":1,"quantity":2}]',
        delivery_id: nil
      }
    end

    context 'when transaction is approved' do
      let(:wompi_response) do
        {
          id: 'txn_123',
          status: 'APPROVED',
          reference: 'ORDER-123',
          amount_in_cents: 50000,
          currency: 'COP'
        }
      end

      before do
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:get_transaction).with(transaction_id)
          .and_return({ success: true, data: { data: wompi_response } })

        allow(transactions_dataset).to receive(:where).with(wompi_transaction_id: transaction_id)
          .and_return(transactions_dataset)
        allow(transactions_dataset).to receive(:first).and_return(transaction_record)
        allow(transactions_dataset).to receive(:where).with(id: 1).and_return(transactions_dataset)
        allow(transactions_dataset).to receive(:update).and_return(1)

        allow(orders_dataset).to receive(:where).with(transaction_id: 1).and_return(orders_dataset)
        allow(orders_dataset).to receive(:first).and_return(order_record)
        allow(orders_dataset).to receive(:where).with(id: 1).and_return(orders_dataset)
        allow(orders_dataset).to receive(:update).and_return(1)

        allow(products_dataset).to receive(:where).with(id: 1).and_return(products_dataset)
        allow(products_dataset).to receive(:first).and_return({ id: 1, stock: 10 })
        allow(products_dataset).to receive(:update).and_return(1)
      end

      it 'updates transaction status to APPROVED' do
        expect(transactions_dataset).to receive(:update).with(hash_including(
          status: 'APPROVED'
        ))

        use_case.execute(transaction_id, max_attempts: 1)
      end

      it 'updates order status to approved' do
        expect(orders_dataset).to receive(:update).with(hash_including(
          status: 'approved'
        ))

        use_case.execute(transaction_id, max_attempts: 1)
      end

      it 'decrements product stock' do
        expect(products_dataset).to receive(:update).with(hash_including(
          stock: 8
        ))

        use_case.execute(transaction_id, max_attempts: 1)
      end

      it 'returns success result' do
        result = use_case.execute(transaction_id, max_attempts: 1)

        expect(result).to be_success
        data = result.value!
        expect(data[:wompi_data][:status]).to eq('APPROVED')
      end
    end

    context 'when transaction is still pending after max attempts' do
      let(:wompi_response) do
        {
          id: 'txn_123',
          status: 'PENDING',
          reference: 'ORDER-123'
        }
      end

      before do
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:get_transaction).with(transaction_id)
          .and_return({ success: true, data: { data: wompi_response } })

        allow(transactions_dataset).to receive(:where).with(wompi_transaction_id: transaction_id)
          .and_return(transactions_dataset)
        allow(transactions_dataset).to receive(:first).and_return(transaction_record)
        allow(transactions_dataset).to receive(:where).with(id: 1).and_return(transactions_dataset)
        allow(transactions_dataset).to receive(:update).and_return(1)

        allow(orders_dataset).to receive(:where).with(transaction_id: 1).and_return(orders_dataset)
        allow(orders_dataset).to receive(:first).and_return(order_record)
        allow(orders_dataset).to receive(:where).with(id: 1).and_return(orders_dataset)
        allow(orders_dataset).to receive(:update).and_return(1)
      end

      it 'returns pending status after max attempts' do
        result = use_case.execute(transaction_id, max_attempts: 2, delay_seconds: 0)

        expect(result).to be_success
        data = result.value!
        expect(data[:status]).to eq('PENDING')
        expect(data[:attempts]).to eq(2)
      end

      it 'does not update stock for pending status' do
        expect(products_dataset).not_to receive(:update)

        use_case.execute(transaction_id, max_attempts: 1)
      end
    end

    context 'when transaction is not found' do
      before do
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:get_transaction).with(transaction_id)
          .and_return({ success: true, data: { data: { id: 'txn_123', status: 'APPROVED' } } })

        allow(transactions_dataset).to receive(:where).with(wompi_transaction_id: transaction_id)
          .and_return(transactions_dataset)
        allow(transactions_dataset).to receive(:first).and_return(nil)
      end

      it 'returns not found error' do
        result = use_case.execute(transaction_id, max_attempts: 1)

        expect(result).to be_failure
        error = result.failure
        expect(error[:type]).to eq(:not_found)
      end
    end

    context 'when Wompi API fails' do
      before do
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:get_transaction).with(transaction_id)
          .and_return({ success: false, error: { type: 'API_ERROR' } })
      end

      it 'returns failure result' do
        result = use_case.execute(transaction_id, max_attempts: 1)

        expect(result).to be_failure
      end
    end
  end

  describe '#execute_from_webhook' do
    let(:webhook_data) do
      {
        transaction: {
          id: 'txn_123',
          status: 'APPROVED',
          reference: 'ORDER-123',
          amount_in_cents: 50000
        }
      }
    end

    let(:transaction_record) do
      {
        id: 1,
        wompi_transaction_id: 'txn_123',
        status: 'PENDING'
      }
    end

    let(:order_record) do
      {
        id: 1,
        transaction_id: 1,
        items: '[{"product_id":1,"quantity":2}]',
        delivery_id: 1
      }
    end

    before do
      allow(transactions_dataset).to receive(:where).with(wompi_transaction_id: 'txn_123')
        .and_return(transactions_dataset)
      allow(transactions_dataset).to receive(:first).and_return(transaction_record)
      allow(transactions_dataset).to receive(:where).with(id: 1).and_return(transactions_dataset)
      allow(transactions_dataset).to receive(:update).and_return(1)

      allow(orders_dataset).to receive(:where).with(transaction_id: 1).and_return(orders_dataset)
      allow(orders_dataset).to receive(:first).and_return(order_record)
      allow(orders_dataset).to receive(:where).with(id: 1).and_return(orders_dataset)
      allow(orders_dataset).to receive(:update).and_return(1)

      allow(products_dataset).to receive(:where).with(id: 1).and_return(products_dataset)
      allow(products_dataset).to receive(:first).and_return({ id: 1, stock: 10 })
      allow(products_dataset).to receive(:update).and_return(1)

      allow(deliveries_dataset).to receive(:where).with(id: 1).and_return(deliveries_dataset)
      allow(deliveries_dataset).to receive(:update).and_return(1)
    end

    it 'updates transaction from webhook data' do
      expect(transactions_dataset).to receive(:update).with(hash_including(
        status: 'APPROVED'
      ))

      use_case.execute_from_webhook(webhook_data)
    end

    it 'updates order status' do
      expect(orders_dataset).to receive(:update).with(hash_including(
        status: 'approved'
      ))

      use_case.execute_from_webhook(webhook_data)
    end

    it 'updates stock if newly approved' do
      expect(products_dataset).to receive(:update).with(hash_including(
        stock: 8
      ))

      use_case.execute_from_webhook(webhook_data)
    end

    it 'updates delivery status' do
      expect(deliveries_dataset).to receive(:update).with(hash_including(
        status: 'assigned'
      ))

      use_case.execute_from_webhook(webhook_data)
    end

    it 'returns success result' do
      result = use_case.execute_from_webhook(webhook_data)

      expect(result).to be_success
    end

    context 'when transaction already approved' do
      let(:already_approved_transaction) do
        {
          id: 1,
          wompi_transaction_id: 'txn_123',
          status: 'APPROVED'
        }
      end

      before do
        allow(transactions_dataset).to receive(:first).and_return(already_approved_transaction)
      end

      it 'does not update stock again' do
        expect(products_dataset).not_to receive(:update)

        use_case.execute_from_webhook(webhook_data)
      end
    end
  end
end
