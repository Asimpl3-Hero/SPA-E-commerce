require 'spec_helper'
require_relative '../../../lib/application/use_cases/process_payment'
require_relative '../../../lib/domain/entities/transaction'
require_relative '../../../lib/domain/entities/order'
require_relative '../../../lib/domain/entities/product'

RSpec.describe Application::UseCases::ProcessPayment do
  let(:order_repository) { double('OrderRepository') }
  let(:transaction_repository) { double('TransactionRepository') }
  let(:delivery_repository) { double('DeliveryRepository') }
  let(:product_repository) { double('ProductRepository') }
  let(:payment_gateway) { double('PaymentGateway') }

  let(:use_case) do
    described_class.new(
      order_repository: order_repository,
      transaction_repository: transaction_repository,
      delivery_repository: delivery_repository,
      product_repository: product_repository,
      payment_gateway: payment_gateway
    )
  end

  let(:order_data) do
    {
      order_id: 1,
      reference: 'ORDER-123',
      amount_in_cents: 10000,
      currency: 'COP',
      customer_email: 'test@example.com',
      customer_name: 'John Doe',
      customer_phone: '3001234567',
      delivery_id: nil,
      items: [{ product_id: 1, quantity: 2 }]
    }
  end

  let(:payment_method) do
    {
      type: 'CARD',
      token: 'tok_test_123'
    }
  end

  let(:acceptance_token) do
    { acceptance_token: 'accept_123', permalink: 'http://example.com' }
  end

  let(:wompi_response) do
    {
      success: true,
      data: {
        data: {
          id: 'wompi-trans-123',
          status: 'APPROVED',
          reference: 'ORDER-123'
        }
      }
    }
  end

  let(:transaction) do
    instance_double(
      Domain::Entities::Transaction,
      id: 1,
      wompi_transaction_id: 'wompi-trans-123',
      status: 'APPROVED'
    )
  end

  let(:order) do
    instance_double(
      Domain::Entities::Order,
      id: 1,
      status: 'approved'
    )
  end

  describe '#execute' do
    context 'with successful payment' do
      before do
        allow(payment_gateway).to receive(:get_acceptance_token)
          .and_return(acceptance_token)
        allow(payment_gateway).to receive(:create_transaction)
          .and_return(wompi_response)
        allow(transaction_repository).to receive(:create)
          .and_return(transaction)
        allow(order_repository).to receive(:update_transaction)
          .and_return(order)
      end

      it 'returns success' do
        result = use_case.execute(order_data, payment_method)

        expect(result).to be_success
      end

      it 'gets acceptance token from payment gateway' do
        expect(payment_gateway).to receive(:get_acceptance_token)

        use_case.execute(order_data, payment_method)
      end

      it 'creates transaction with payment gateway' do
        expect(payment_gateway).to receive(:create_transaction).with(hash_including(
          amount_in_cents: 10000,
          reference: 'ORDER-123'
        ))

        use_case.execute(order_data, payment_method)
      end

      it 'creates transaction record' do
        expect(transaction_repository).to receive(:create).with(hash_including(
          wompi_transaction_id: 'wompi-trans-123',
          status: 'APPROVED'
        ))

        use_case.execute(order_data, payment_method)
      end

      it 'updates order with transaction' do
        expect(order_repository).to receive(:update_transaction).with(
          1, 1, 'approved'
        )

        use_case.execute(order_data, payment_method)
      end

      it 'returns wompi data' do
        result = use_case.execute(order_data, payment_method)

        expect(result.value![:wompi_data][:id]).to eq('wompi-trans-123')
        expect(result.value![:wompi_data][:status]).to eq('APPROVED')
      end
    end

    context 'when acceptance token fails' do
      before do
        allow(payment_gateway).to receive(:get_acceptance_token)
          .and_return(nil)
      end

      it 'returns server error' do
        result = use_case.execute(order_data, payment_method)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to include('acceptance token')
      end
    end

    context 'when payment gateway fails' do
      before do
        allow(payment_gateway).to receive(:get_acceptance_token)
          .and_return(acceptance_token)
        allow(payment_gateway).to receive(:create_transaction)
          .and_return({ success: false, error: { type: 'CARD_DECLINED' } })
      end

      it 'returns payment failed error' do
        result = use_case.execute(order_data, payment_method)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:payment_failed)
      end
    end

    context 'with NEQUI payment method' do
      let(:nequi_payment) do
        {
          type: 'NEQUI',
          phone_number: '3001234567'
        }
      end

      before do
        allow(payment_gateway).to receive(:get_acceptance_token)
          .and_return(acceptance_token)
        allow(payment_gateway).to receive(:create_transaction)
          .and_return(wompi_response)
        allow(transaction_repository).to receive(:create)
          .and_return(transaction)
        allow(order_repository).to receive(:update_transaction)
          .and_return(order)
      end

      it 'includes nequi_phone_number in params' do
        expect(payment_gateway).to receive(:create_transaction).with(hash_including(
          nequi_phone_number: '3001234567',
          payment_method_type: 'NEQUI'
        ))

        use_case.execute(order_data, nequi_payment)
      end
    end
  end

  describe '#create_failed_transaction' do
    let(:error) { { type: 'CARD_DECLINED', message: 'Card was declined' } }

    before do
      allow(transaction_repository).to receive(:create).and_return(transaction)
      allow(order_repository).to receive(:update_transaction).and_return(order)
    end

    it 'creates transaction with ERROR status' do
      expect(transaction_repository).to receive(:create).with(hash_including(
        status: 'ERROR',
        payment_data: error
      ))

      use_case.create_failed_transaction(order_data, payment_method, error)
    end

    it 'updates order status to error' do
      expect(order_repository).to receive(:update_transaction).with(
        1, 1, 'error'
      )

      use_case.create_failed_transaction(order_data, payment_method, error)
    end
  end
end
