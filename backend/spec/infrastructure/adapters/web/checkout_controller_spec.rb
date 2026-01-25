require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/web/checkout_controller'
require 'rack/test'

RSpec.describe Infrastructure::Adapters::Web::CheckoutController, type: :controller do
  include Rack::Test::Methods

  let(:create_order_use_case) { double('CreateOrder') }
  let(:process_payment_use_case) { double('ProcessPayment') }
  let(:process_existing_order_payment_use_case) { double('ProcessExistingOrderPayment') }
  let(:get_order_use_case) { double('GetOrderByReference') }
  let(:update_transaction_status_use_case) { double('UpdateTransactionStatus') }
  let(:payment_gateway) { double('PaymentGateway') }

  before do
    described_class.create_order_use_case = create_order_use_case
    described_class.process_payment_use_case = process_payment_use_case
    described_class.process_existing_order_payment_use_case = process_existing_order_payment_use_case
    described_class.get_order_use_case = get_order_use_case
    described_class.update_transaction_status_use_case = update_transaction_status_use_case
    described_class.payment_gateway = payment_gateway
  end

  def app
    described_class
  end

  describe 'POST /api/checkout/create-order' do
    let(:order_data) do
      {
        customer_email: 'test@example.com',
        customer_name: 'John Doe',
        items: [{ product_id: 1, quantity: 2 }],
        amount_in_cents: 10000
      }
    end

    context 'when order creation succeeds without payment' do
      let(:order_result) do
        {
          order_id: 1,
          reference: 'ORDER-123',
          amount_in_cents: 10000,
          currency: 'COP'
        }
      end

      before do
        allow(create_order_use_case).to receive(:execute)
          .and_return(Dry::Monads::Success(order_result))
      end

      it 'returns 201 status' do
        post '/api/checkout/create-order', Oj.dump(order_data), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(201)
      end

      it 'returns order data' do
        post '/api/checkout/create-order', Oj.dump(order_data), 'CONTENT_TYPE' => 'application/json'

        data = json_response
        expect(data[:success]).to be(true)
        expect(data[:order][:reference]).to eq('ORDER-123')
      end
    end

    context 'when order creation succeeds with payment' do
      let(:order_data_with_payment) do
        order_data.merge(
          payment_method: { type: 'CARD', token: 'tok_123' }
        )
      end

      let(:order_result) do
        {
          order_id: 1,
          reference: 'ORDER-123',
          amount_in_cents: 10000,
          currency: 'COP'
        }
      end

      let(:payment_result) do
        {
          order_status: 'approved',
          wompi_data: { id: 'wompi-123', status: 'APPROVED' }
        }
      end

      before do
        allow(create_order_use_case).to receive(:execute)
          .and_return(Dry::Monads::Success(order_result))
        allow(process_payment_use_case).to receive(:execute)
          .and_return(Dry::Monads::Success(payment_result))
      end

      it 'returns 201 status' do
        post '/api/checkout/create-order', Oj.dump(order_data_with_payment), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(201)
      end

      it 'returns order and transaction data' do
        post '/api/checkout/create-order', Oj.dump(order_data_with_payment), 'CONTENT_TYPE' => 'application/json'

        data = json_response
        expect(data[:success]).to be(true)
        expect(data[:order][:status]).to eq('approved')
        expect(data[:transaction][:status]).to eq('APPROVED')
      end
    end

    context 'when order creation fails with validation error' do
      let(:error) { { type: :validation_error, message: 'Missing fields', details: { missing: [:items] } } }

      before do
        allow(create_order_use_case).to receive(:execute)
          .and_return(Dry::Monads::Failure(error))
      end

      it 'returns 400 status' do
        post '/api/checkout/create-order', Oj.dump({}), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(400)
      end

      it 'returns error details' do
        post '/api/checkout/create-order', Oj.dump({}), 'CONTENT_TYPE' => 'application/json'

        data = json_response
        expect(data[:success]).to be(false)
        expect(data[:error]).to eq('Missing fields')
      end
    end

    context 'with invalid JSON' do
      it 'returns 400 status' do
        post '/api/checkout/create-order', 'invalid json', 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(400)
      end
    end
  end

  describe 'GET /api/checkout/order/:reference' do
    context 'when order exists' do
      let(:order_data) do
        {
          id: 1,
          reference: 'ORDER-123',
          customer_email: 'test@example.com',
          amount_in_cents: 10000,
          status: 'approved'
        }
      end

      before do
        allow(get_order_use_case).to receive(:execute)
          .with('ORDER-123')
          .and_return(Dry::Monads::Success(order_data))
      end

      it 'returns 200 status' do
        get '/api/checkout/order/ORDER-123'

        expect(last_response.status).to eq(200)
      end

      it 'returns order data' do
        get '/api/checkout/order/ORDER-123'

        data = json_response
        expect(data[:success]).to be(true)
        expect(data[:order][:reference]).to eq('ORDER-123')
      end
    end

    context 'when order does not exist' do
      before do
        allow(get_order_use_case).to receive(:execute)
          .with('NONEXISTENT')
          .and_return(Dry::Monads::Failure({ type: :not_found, message: 'Order not found' }))
      end

      it 'returns 404 status' do
        get '/api/checkout/order/NONEXISTENT'

        expect(last_response.status).to eq(404)
      end
    end
  end

  describe 'GET /api/checkout/acceptance-token' do
    context 'when token retrieval succeeds' do
      let(:token) { { acceptance_token: 'token_123', permalink: 'http://example.com' } }

      before do
        allow(payment_gateway).to receive(:get_acceptance_token)
          .and_return(token)
      end

      it 'returns 200 status' do
        get '/api/checkout/acceptance-token'

        expect(last_response.status).to eq(200)
      end

      it 'returns acceptance token' do
        get '/api/checkout/acceptance-token'

        data = json_response
        expect(data[:success]).to be(true)
        expect(data[:acceptance_token][:acceptance_token]).to eq('token_123')
      end
    end

    context 'when token retrieval fails' do
      before do
        allow(payment_gateway).to receive(:get_acceptance_token)
          .and_return(nil)
      end

      it 'returns 500 status' do
        get '/api/checkout/acceptance-token'

        expect(last_response.status).to eq(500)
      end
    end
  end

  describe 'GET /api/checkout/transaction-status/:transaction_id' do
    context 'when transaction has final status' do
      let(:result) do
        {
          wompi_data: {
            id: 'trans-123',
            status: 'APPROVED',
            reference: 'ORDER-123',
            amount_in_cents: 10000,
            currency: 'COP'
          }
        }
      end

      before do
        allow(update_transaction_status_use_case).to receive(:execute)
          .with('trans-123')
          .and_return(Dry::Monads::Success(result))
      end

      it 'returns 200 status' do
        get '/api/checkout/transaction-status/trans-123'

        expect(last_response.status).to eq(200)
      end

      it 'returns transaction status' do
        get '/api/checkout/transaction-status/trans-123'

        data = json_response
        expect(data[:success]).to be(true)
        expect(data[:transaction][:status]).to eq('APPROVED')
      end
    end

    context 'when transaction is still pending' do
      let(:result) do
        {
          status: 'PENDING',
          message: 'Transaction is still being processed',
          attempts: 5
        }
      end

      before do
        allow(update_transaction_status_use_case).to receive(:execute)
          .with('trans-pending')
          .and_return(Dry::Monads::Success(result))
      end

      it 'returns pending status with attempts' do
        get '/api/checkout/transaction-status/trans-pending'

        data = json_response
        expect(data[:success]).to be(true)
        expect(data[:transaction][:status]).to eq('PENDING')
        expect(data[:attempts]).to eq(5)
      end
    end

    context 'when transaction not found' do
      before do
        allow(update_transaction_status_use_case).to receive(:execute)
          .with('nonexistent')
          .and_return(Dry::Monads::Failure({ type: :not_found, message: 'Transaction not found' }))
      end

      it 'returns 404 status' do
        get '/api/checkout/transaction-status/nonexistent'

        expect(last_response.status).to eq(404)
      end
    end
  end

  describe 'POST /api/checkout/process-payment' do
    let(:payment_data) do
      {
        reference: 'ORDER-123',
        payment_method_type: 'CARD',
        payment_token: 'tok_123'
      }
    end

    context 'when payment succeeds' do
      let(:result) do
        {
          wompi_data: {
            id: 'trans-123',
            status: 'APPROVED',
            reference: 'ORDER-123'
          }
        }
      end

      before do
        allow(process_existing_order_payment_use_case).to receive(:execute)
          .and_return(Dry::Monads::Success(result))
      end

      it 'returns 200 status' do
        post '/api/checkout/process-payment', Oj.dump(payment_data), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(200)
      end

      it 'returns transaction data' do
        post '/api/checkout/process-payment', Oj.dump(payment_data), 'CONTENT_TYPE' => 'application/json'

        data = json_response
        expect(data[:success]).to be(true)
        expect(data[:transaction][:status]).to eq('APPROVED')
      end
    end

    context 'when order not found' do
      before do
        allow(process_existing_order_payment_use_case).to receive(:execute)
          .and_return(Dry::Monads::Failure({ type: :not_found, message: 'Order not found' }))
      end

      it 'returns 404 status' do
        post '/api/checkout/process-payment', Oj.dump(payment_data), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(404)
      end
    end

    context 'when payment fails' do
      before do
        allow(process_existing_order_payment_use_case).to receive(:execute)
          .and_return(Dry::Monads::Failure({ type: :payment_failed, error: 'Card declined' }))
      end

      it 'returns 400 status' do
        post '/api/checkout/process-payment', Oj.dump(payment_data), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(400)
      end
    end
  end
end
