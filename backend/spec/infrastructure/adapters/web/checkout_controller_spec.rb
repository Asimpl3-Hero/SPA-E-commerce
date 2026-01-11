# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Checkout Controller' do
  let(:product_id) { create_test_product(name: 'Test Product', price: 10000, stock: 10) }

  let(:valid_checkout_params) do
    {
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      customer_phone: '+573001234567',
      amount_in_cents: 10000,
      currency: 'COP',
      payment_method: {
        type: 'CARD',
        token: 'tok_test_12345',
        installments: 1
      },
      items: [
        {
          product_id: product_id,
          name: 'Test Product',
          price_at_purchase: 10000,
          quantity: 1
        }
      ],
      shipping_address: {
        address_line_1: 'Calle 123',
        city: 'Bogota',
        region: 'Bogota DC',
        country: 'CO',
        phone_number: '+573001234567'
      }
    }
  end

  describe 'POST /api/checkout' do
    context 'with valid data and approved payment' do
      before do
        # Mock acceptance token
        stub_request(:get, %r{#{ENV['WOMPI_SANDBOX_URL']}/merchants/.*})
          .to_return(
            status: 200,
            body: {
              data: {
                presigned_acceptance: {
                  acceptance_token: 'test_acceptance_token',
                  permalink: 'https://example.com/terms'
                }
              }
            }.to_json
          )

        # Mock successful transaction
        stub_request(:post, "#{ENV['WOMPI_SANDBOX_URL']}/transactions")
          .to_return(
            status: 201,
            body: {
              data: {
                id: 'wompi-transaction-123',
                status: 'APPROVED',
                amount_in_cents: 10000,
                reference: anything
              }
            }.to_json
          )
      end

      it 'creates order successfully' do
        post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(201)
        expect(json_response[:success]).to be true
        expect(json_response[:order][:status]).to eq('approved')
      end

      it 'creates customer record' do
        expect {
          post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'
        }.to change { db[:customers].count }.by(1)

        customer = db[:customers].last
        expect(customer[:email]).to eq('test@example.com')
        expect(customer[:full_name]).to eq('Test User')
      end

      it 'creates transaction record' do
        expect {
          post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'
        }.to change { db[:transactions].count }.by(1)

        transaction = db[:transactions].last
        expect(transaction[:wompi_transaction_id]).to eq('wompi-transaction-123')
        expect(transaction[:status]).to eq('APPROVED')
      end

      it 'creates delivery record' do
        expect {
          post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'
        }.to change { db[:deliveries].count }.by(1)

        delivery = db[:deliveries].last
        expect(delivery[:address_line_1]).to eq('Calle 123')
        expect(delivery[:city]).to eq('Bogota')
      end

      it 'creates order record with all relationships' do
        expect {
          post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'
        }.to change { db[:orders].count }.by(1)

        order = db[:orders].last
        expect(order[:customer_id]).not_to be_nil
        expect(order[:transaction_id]).not_to be_nil
        expect(order[:delivery_id]).not_to be_nil
        expect(order[:status]).to eq('approved')
      end

      it 'decrements product stock' do
        initial_stock = db[:products].where(id: product_id).get(:stock)

        post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'

        new_stock = db[:products].where(id: product_id).get(:stock)
        expect(new_stock).to eq(initial_stock - 1)
      end

      it 'stores items in order' do
        post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'

        order = db[:orders].last
        items = JSON.parse(order[:items].to_json, symbolize_names: true)
        expect(items.length).to eq(1)
        expect(items.first[:product_id]).to eq(product_id)
      end
    end

    context 'with NEQUI payment method' do
      let(:nequi_params) do
        valid_checkout_params.merge(
          payment_method: {
            type: 'NEQUI',
            phone_number: '3991111111'
          }
        )
      end

      before do
        stub_request(:get, %r{#{ENV['WOMPI_SANDBOX_URL']}/merchants/.*})
          .to_return(
            status: 200,
            body: { data: { presigned_acceptance: { acceptance_token: 'token' } } }.to_json
          )

        stub_request(:post, "#{ENV['WOMPI_SANDBOX_URL']}/transactions")
          .to_return(
            status: 201,
            body: {
              data: {
                id: 'nequi-transaction-123',
                status: 'PENDING',
                amount_in_cents: 10000
              }
            }.to_json
          )
      end

      it 'creates order with pending status' do
        post '/api/checkout', nequi_params.to_json, 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(201)
        expect(json_response[:order][:status]).to eq('pending')
      end

      it 'does not decrement stock until approved' do
        initial_stock = db[:products].where(id: product_id).get(:stock)

        post '/api/checkout', nequi_params.to_json, 'CONTENT_TYPE' => 'application/json'

        new_stock = db[:products].where(id: product_id).get(:stock)
        expect(new_stock).to eq(initial_stock)
      end
    end

    context 'with declined payment' do
      before do
        stub_request(:get, %r{#{ENV['WOMPI_SANDBOX_URL']}/merchants/.*})
          .to_return(
            status: 200,
            body: { data: { presigned_acceptance: { acceptance_token: 'token' } } }.to_json
          )

        stub_request(:post, "#{ENV['WOMPI_SANDBOX_URL']}/transactions")
          .to_return(
            status: 201,
            body: {
              data: {
                id: 'declined-transaction',
                status: 'DECLINED',
                amount_in_cents: 10000
              }
            }.to_json
          )
      end

      it 'creates order with declined status' do
        post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(201)
        expect(json_response[:order][:status]).to eq('declined')
      end

      it 'does not decrement stock' do
        initial_stock = db[:products].where(id: product_id).get(:stock)

        post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'

        new_stock = db[:products].where(id: product_id).get(:stock)
        expect(new_stock).to eq(initial_stock)
      end
    end

    context 'with missing required fields' do
      it 'returns 400 for missing customer_email' do
        params = valid_checkout_params.dup
        params.delete(:customer_email)

        post '/api/checkout', params.to_json, 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(400)
        expect(json_response[:error]).to be_present
      end

      it 'returns 400 for missing items' do
        params = valid_checkout_params.dup
        params.delete(:items)

        post '/api/checkout', params.to_json, 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(400)
      end
    end

    context 'when Wompi API fails' do
      before do
        stub_request(:get, %r{#{ENV['WOMPI_SANDBOX_URL']}/merchants/.*})
          .to_return(status: 500)
      end

      it 'returns 500 error' do
        post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(500)
        expect(json_response[:error]).to be_present
      end
    end

    context 'with existing customer' do
      let!(:existing_customer_id) do
        create_test_customer(email: 'test@example.com', full_name: 'Existing User')
      end

      before do
        stub_request(:get, %r{#{ENV['WOMPI_SANDBOX_URL']}/merchants/.*})
          .to_return(
            status: 200,
            body: { data: { presigned_acceptance: { acceptance_token: 'token' } } }.to_json
          )

        stub_request(:post, "#{ENV['WOMPI_SANDBOX_URL']}/transactions")
          .to_return(
            status: 201,
            body: { data: { id: 'tx-123', status: 'APPROVED', amount_in_cents: 10000 } }.to_json
          )
      end

      it 'does not create duplicate customer' do
        expect {
          post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'
        }.not_to change { db[:customers].count }
      end

      it 'updates customer information' do
        post '/api/checkout', valid_checkout_params.to_json, 'CONTENT_TYPE' => 'application/json'

        customer = db[:customers].where(id: existing_customer_id).first
        expect(customer[:full_name]).to eq('Test User')
      end
    end
  end

  describe 'POST /api/checkout/webhook' do
    let(:customer_id) { create_test_customer }
    let(:delivery_id) { create_test_delivery }
    let(:transaction_id) { create_test_transaction(status: 'PENDING', wompi_transaction_id: 'wompi-123') }
    let(:order_id) do
      create_test_order(
        customer_id: customer_id,
        transaction_id: transaction_id,
        delivery_id: delivery_id,
        attributes: {
          status: 'pending',
          items: [{ product_id: product_id, quantity: 1 }]
        }
      )
    end

    let(:webhook_payload) do
      {
        event: 'transaction.updated',
        data: {
          transaction: {
            id: 'wompi-123',
            status: 'APPROVED',
            amount_in_cents: 10000
          }
        },
        sent_at: '2024-01-01T00:00:00Z'
      }
    end

    context 'with valid signature' do
      let(:timestamp) { '1234567890' }
      let(:signature) do
        payload_string = webhook_payload.to_json
        Digest::SHA256.hexdigest("#{payload_string}#{timestamp}#{ENV['WOMPI_EVENT_KEY']}")
      end

      before do
        order_id # Create the order
      end

      it 'updates transaction status' do
        post '/api/checkout/webhook',
             webhook_payload.to_json,
             'CONTENT_TYPE' => 'application/json',
             'HTTP_X_WOMPI_SIGNATURE' => signature,
             'HTTP_X_WOMPI_TIMESTAMP' => timestamp

        expect(last_response.status).to eq(200)

        transaction = db[:transactions].where(id: transaction_id).first
        expect(transaction[:status]).to eq('APPROVED')
      end

      it 'updates order status' do
        post '/api/checkout/webhook',
             webhook_payload.to_json,
             'CONTENT_TYPE' => 'application/json',
             'HTTP_X_WOMPI_SIGNATURE' => signature,
             'HTTP_X_WOMPI_TIMESTAMP' => timestamp

        order = db[:orders].where(id: order_id).first
        expect(order[:status]).to eq('approved')
      end

      it 'decrements stock when status changes to APPROVED' do
        initial_stock = db[:products].where(id: product_id).get(:stock)

        post '/api/checkout/webhook',
             webhook_payload.to_json,
             'CONTENT_TYPE' => 'application/json',
             'HTTP_X_WOMPI_SIGNATURE' => signature,
             'HTTP_X_WOMPI_TIMESTAMP' => timestamp

        new_stock = db[:products].where(id: product_id).get(:stock)
        expect(new_stock).to eq(initial_stock - 1)
      end
    end

    context 'with invalid signature' do
      it 'returns 401 unauthorized' do
        post '/api/checkout/webhook',
             webhook_payload.to_json,
             'CONTENT_TYPE' => 'application/json',
             'HTTP_X_WOMPI_SIGNATURE' => 'invalid-signature',
             'HTTP_X_WOMPI_TIMESTAMP' => '123456'

        expect(last_response.status).to eq(401)
      end
    end

    context 'with missing signature headers' do
      it 'returns 401' do
        post '/api/checkout/webhook',
             webhook_payload.to_json,
             'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(401)
      end
    end
  end
end
