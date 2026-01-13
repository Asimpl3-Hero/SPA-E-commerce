require 'spec_helper'
require_relative '../../../lib/application/use_cases/process_payment'
require_relative '../../../lib/infrastructure/adapters/payment/wompi_service'

RSpec.describe Application::UseCases::ProcessPayment do
  let(:db) { instance_double('Sequel::Database') }
  let(:transactions_dataset) { instance_double('Sequel::Dataset') }
  let(:orders_dataset) { instance_double('Sequel::Dataset') }
  let(:products_dataset) { instance_double('Sequel::Dataset') }
  let(:deliveries_dataset) { instance_double('Sequel::Dataset') }
  let(:use_case) { described_class.new(db) }

  let(:order_data) do
    {
      order_id: 1,
      reference: 'ORDER-123',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      customer_phone: '1234567890',
      amount_in_cents: 50000,
      currency: 'COP',
      items: [{ product_id: 1, quantity: 2 }],
      delivery_id: nil,
      redirect_url: 'http://localhost/confirm'
    }
  end

  let(:payment_method) do
    {
      type: 'CARD',
      token: 'tok_test_12345'
    }
  end

  before do
    allow(db).to receive(:[]).with(:transactions).and_return(transactions_dataset)
    allow(db).to receive(:[]).with(:orders).and_return(orders_dataset)
    allow(db).to receive(:[]).with(:products).and_return(products_dataset)
    allow(db).to receive(:[]).with(:deliveries).and_return(deliveries_dataset)
  end

  describe '#execute' do
    context 'with successful payment' do
      let(:acceptance_token) { { acceptance_token: 'acc_test_123' } }
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
          .to receive(:get_acceptance_token).and_return(acceptance_token)
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:create_transaction).and_return({ success: true, data: { data: wompi_response } })

        allow(transactions_dataset).to receive(:insert).and_return(1)
        allow(orders_dataset).to receive(:where).with(id: 1).and_return(orders_dataset)
        allow(orders_dataset).to receive(:update).and_return(1)
        allow(products_dataset).to receive(:where).with(id: 1).and_return(products_dataset)
        allow(products_dataset).to receive(:first).and_return({ id: 1, stock: 10 })
        allow(products_dataset).to receive(:update).and_return(1)
      end

      it 'processes payment successfully' do
        result = use_case.execute(order_data, payment_method)

        expect(result).to be_success
        payment = result.value!
        expect(payment[:wompi_data][:id]).to eq('txn_123')
        expect(payment[:wompi_data][:status]).to eq('APPROVED')
        expect(payment[:order_status]).to eq('approved')
      end

      it 'creates transaction record in database' do
        expect(transactions_dataset).to receive(:insert).with(hash_including(
          wompi_transaction_id: 'txn_123',
          reference: 'ORDER-123',
          status: 'APPROVED'
        ))

        use_case.execute(order_data, payment_method)
      end

      it 'updates order status' do
        expect(orders_dataset).to receive(:update).with(hash_including(
          status: 'approved'
        ))

        use_case.execute(order_data, payment_method)
      end

      it 'decrements product stock' do
        expect(products_dataset).to receive(:update).with(hash_including(
          stock: 8 # 10 - 2
        ))

        use_case.execute(order_data, payment_method)
      end

      context 'with delivery' do
        let(:order_with_delivery) { order_data.merge(delivery_id: 1) }

        before do
          allow(deliveries_dataset).to receive(:where).with(id: 1).and_return(deliveries_dataset)
          allow(deliveries_dataset).to receive(:update).and_return(1)
        end

        it 'updates delivery status to assigned' do
          expect(deliveries_dataset).to receive(:update).with(hash_including(
            status: 'assigned'
          ))

          use_case.execute(order_with_delivery, payment_method)
        end
      end
    end

    context 'with failed payment' do
      let(:acceptance_token) { { acceptance_token: 'acc_test_123' } }

      before do
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:get_acceptance_token).and_return(acceptance_token)
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:create_transaction).and_return({
            success: false,
            error: { type: 'CARD_DECLINED', message: 'Card was declined' }
          })
      end

      it 'returns payment failure' do
        result = use_case.execute(order_data, payment_method)

        expect(result).to be_failure
        error = result.failure
        expect(error[:type]).to eq(:payment_failed)
      end

      it 'does not update stock' do
        expect(products_dataset).not_to receive(:update)

        use_case.execute(order_data, payment_method)
      end
    end

    context 'when acceptance token fails' do
      before do
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:get_acceptance_token).and_return(nil)
      end

      it 'returns server error' do
        result = use_case.execute(order_data, payment_method)

        expect(result).to be_failure
        error = result.failure
        expect(error[:type]).to eq(:server_error)
        expect(error[:message]).to include('Failed to get acceptance token')
      end
    end

    context 'with NEQUI payment method' do
      let(:nequi_payment) do
        {
          type: 'NEQUI',
          phone_number: '3001234567'
        }
      end

      let(:acceptance_token) { { acceptance_token: 'acc_test_123' } }
      let(:wompi_response) do
        {
          id: 'txn_nequi_123',
          status: 'PENDING',
          reference: 'ORDER-123'
        }
      end

      before do
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:get_acceptance_token).and_return(acceptance_token)
        allow(Infrastructure::Adapters::Payment::WompiService)
          .to receive(:create_transaction).and_return({ success: true, data: { data: wompi_response } })

        allow(transactions_dataset).to receive(:insert).and_return(1)
        allow(orders_dataset).to receive(:where).and_return(orders_dataset)
        allow(orders_dataset).to receive(:update).and_return(1)
      end

      it 'processes NEQUI payment with phone number' do
        result = use_case.execute(order_data, nequi_payment)

        expect(result).to be_success
        expect(result.value![:wompi_data][:status]).to eq('PENDING')
      end

      it 'does not update stock for pending payment' do
        expect(products_dataset).not_to receive(:update)

        use_case.execute(order_data, nequi_payment)
      end
    end
  end
end
