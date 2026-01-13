# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Infrastructure::Adapters::Payment::WompiService do
  let(:base_url) { ENV['WOMPI_SANDBOX_URL'] }
  let(:private_key) { ENV['WOMPI_PRIVATE_KEY'] }
  let(:public_key) { ENV['WOMPI_PUBLIC_KEY'] }
  let(:integrity_key) { ENV['WOMPI_INTEGRITY_KEY'] }

  describe '.create_transaction' do
    let(:params) do
      {
        acceptance_token: 'test_acceptance_token',
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        payment_method_type: 'CARD',
        payment_token: 'tok_test_12345',
        reference: 'ORDER-123',
        phone_number: '+573001234567',
        full_name: 'Test User',
        shipping_address: {
          address_line_1: 'Calle 123',
          city: 'Bogota',
          region: 'Bogota DC',
          country: 'CO'
        },
        redirect_url: 'https://example.com/callback'
      }
    end

    context 'when transaction is successful' do
      before do
        stub_request(:post, "#{base_url}/transactions")
          .with(
            headers: {
              'Authorization' => "Bearer #{private_key}",
              'Content-Type' => 'application/json'
            }
          )
          .to_return(
            status: 201,
            body: {
              data: {
                id: 'test-transaction-id',
                status: 'APPROVED',
                amount_in_cents: 10000
              }
            }.to_json
          )
      end

      it 'creates a transaction successfully' do
        result = described_class.create_transaction(params)

        expect(result[:success]).to be true
        expect(result[:data][:data][:id]).to eq('test-transaction-id')
        expect(result[:data][:data][:status]).to eq('APPROVED')
      end

      it 'includes integrity signature' do
        described_class.create_transaction(params)

        expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
          .with { |req|
            body = JSON.parse(req.body, symbolize_names: true)
            expect(body[:signature]).not_to be_nil
            expect(body[:signature]).to be_a(String)
          }
      end

      it 'includes payment method data for CARD' do
        described_class.create_transaction(params)

        expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
          .with { |req|
            body = JSON.parse(req.body, symbolize_names: true)
            expect(body[:payment_method][:type]).to eq('CARD')
            expect(body[:payment_method][:token]).to eq('tok_test_12345')
            expect(body[:payment_method][:installments]).to eq(1)
          }
      end
    end

    context 'when payment method is NEQUI' do
      let(:nequi_params) do
        params.merge(
          payment_method_type: 'NEQUI',
          nequi_phone_number: '3991111111'
        )
      end

      before do
        stub_request(:post, "#{base_url}/transactions")
          .to_return(
            status: 201,
            body: { data: { id: 'nequi-transaction' } }.to_json
          )
      end

      it 'includes NEQUI phone number' do
        described_class.create_transaction(nequi_params)

        expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
          .with { |req|
            body = JSON.parse(req.body, symbolize_names: true)
            expect(body[:payment_method][:type]).to eq('NEQUI')
            expect(body[:payment_method][:phone_number]).to eq('3991111111')
          }
      end
    end

    context 'when transaction fails' do
      before do
        stub_request(:post, "#{base_url}/transactions")
          .to_return(
            status: 400,
            body: {
              error: {
                type: 'INVALID_CARD',
                message: 'The card is invalid'
              }
            }.to_json
          )
      end

      it 'returns error information' do
        result = described_class.create_transaction(params)

        expect(result[:success]).to be false
        expect(result[:error][:type]).to eq('INVALID_CARD')
        expect(result[:error][:message]).to eq('The card is invalid')
      end
    end

    context 'when response cannot be parsed' do
      before do
        stub_request(:post, "#{base_url}/transactions")
          .to_return(
            status: 500,
            body: 'Invalid JSON'
          )
      end

      it 'returns parse error' do
        result = described_class.create_transaction(params)

        expect(result[:success]).to be false
        expect(result[:error][:type]).to eq('parse_error')
      end
    end
  end

  describe '.get_acceptance_token' do
    context 'when request is successful' do
      let(:acceptance_data) do
        {
          acceptance_token: 'test_acceptance_token',
          permalink: 'https://example.com/terms'
        }
      end

      before do
        stub_request(:get, "#{base_url}/merchants/#{public_key}")
          .to_return(
            status: 200,
            body: {
              data: {
                presigned_acceptance: acceptance_data
              }
            }.to_json
          )
      end

      it 'retrieves acceptance token' do
        result = described_class.get_acceptance_token

        expect(result[:acceptance_token]).to eq('test_acceptance_token')
        expect(result[:permalink]).to eq('https://example.com/terms')
      end
    end

    context 'when request fails' do
      before do
        stub_request(:get, "#{base_url}/merchants/#{public_key}")
          .to_return(
            status: 404,
            body: { error: { type: 'NOT_FOUND' } }.to_json
          )
      end

      it 'returns nil' do
        result = described_class.get_acceptance_token

        expect(result).to be_nil
      end
    end
  end

  describe '.get_transaction' do
    let(:transaction_id) { 'test-transaction-id' }

    context 'when transaction exists' do
      before do
        stub_request(:get, "#{base_url}/transactions/#{transaction_id}")
          .with(headers: { 'Authorization' => "Bearer #{private_key}" })
          .to_return(
            status: 200,
            body: {
              data: {
                id: transaction_id,
                status: 'APPROVED',
                amount_in_cents: 10000
              }
            }.to_json
          )
      end

      it 'retrieves transaction details' do
        result = described_class.get_transaction(transaction_id)

        expect(result[:success]).to be true
        expect(result[:data][:data][:id]).to eq(transaction_id)
        expect(result[:data][:data][:status]).to eq('APPROVED')
      end
    end

    context 'when transaction does not exist' do
      before do
        stub_request(:get, "#{base_url}/transactions/#{transaction_id}")
          .to_return(
            status: 404,
            body: { error: { type: 'NOT_FOUND' } }.to_json
          )
      end

      it 'returns error' do
        result = described_class.get_transaction(transaction_id)

        expect(result[:success]).to be false
        expect(result[:error][:type]).to eq('NOT_FOUND')
      end
    end
  end

  describe '.validate_webhook_signature' do
    let(:payload) { '{"event":"transaction.updated"}' }
    let(:timestamp) { '1234567890' }
    let(:event_key) { ENV['WOMPI_EVENT_KEY'] }

    context 'when signature is valid' do
      let(:valid_signature) do
        Digest::SHA256.hexdigest("#{payload}#{timestamp}#{event_key}")
      end

      it 'returns true' do
        result = described_class.validate_webhook_signature(
          payload,
          valid_signature,
          timestamp
        )

        expect(result).to be true
      end
    end

    context 'when signature is invalid' do
      it 'returns false' do
        result = described_class.validate_webhook_signature(
          payload,
          'invalid-signature',
          timestamp
        )

        expect(result).to be false
      end
    end
  end

  describe '.generate_signature' do
    it 'generates correct signature for transaction' do
      reference = 'ORDER-123'
      amount = 10000
      currency = 'COP'

      expected = Digest::SHA256.hexdigest("#{reference}#{amount}#{currency}#{integrity_key}")
      actual = described_class.send(:generate_signature, reference, amount, currency)

      expect(actual).to eq(expected)
    end
  end

  describe '.parse_response' do
    context 'with successful response' do
      let(:response) do
        double('Response', code: '200', body: '{"data":"test"}')
      end

      it 'returns success with parsed data' do
        result = described_class.send(:parse_response, response)

        expect(result[:success]).to be true
        expect(result[:data][:data]).to eq('test')
      end
    end

    context 'with error response' do
      let(:response) do
        double('Response', code: '400', body: '{"error":{"type":"ERROR"}}')
      end

      it 'returns failure with error data' do
        result = described_class.send(:parse_response, response)

        expect(result[:success]).to be false
        expect(result[:error][:type]).to eq('ERROR')
      end
    end

    context 'with invalid JSON' do
      let(:response) do
        double('Response', code: '500', body: 'Invalid JSON')
      end

      it 'returns parse error' do
        result = described_class.send(:parse_response, response)

        expect(result[:success]).to be false
        expect(result[:error][:type]).to eq('parse_error')
      end
    end

    context 'with error response without error key' do
      let(:response) do
        double('Response', code: '500', body: '{}')
      end

      it 'returns unknown error' do
        result = described_class.send(:parse_response, response)

        expect(result[:success]).to be false
        expect(result[:error][:type]).to eq('unknown_error')
        expect(result[:error][:message]).to eq('Unknown error occurred')
      end
    end

    context 'with 2xx status code variants' do
      it 'returns success for 200 OK' do
        response = double('Response', code: '200', body: '{"data":"test"}')
        result = described_class.send(:parse_response, response)

        expect(result[:success]).to be true
      end

      it 'returns success for 201 Created' do
        response = double('Response', code: '201', body: '{"data":"test"}')
        result = described_class.send(:parse_response, response)

        expect(result[:success]).to be true
      end

      it 'returns success for 204 No Content' do
        response = double('Response', code: '204', body: 'null')
        result = described_class.send(:parse_response, response)

        expect(result[:success]).to be true
      end
    end
  end

  describe '.create_transaction with custom installments' do
    let(:params_with_installments) do
      {
        acceptance_token: 'test_acceptance_token',
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        payment_method_type: 'CARD',
        payment_token: 'tok_test_12345',
        installments: 6,
        reference: 'ORDER-123',
        phone_number: '+573001234567',
        full_name: 'Test User',
        shipping_address: {},
        redirect_url: 'https://example.com/callback'
      }
    end

    before do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 201, body: { data: {} }.to_json)
    end

    it 'includes custom installments when provided' do
      described_class.create_transaction(params_with_installments)

      expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
        .with { |req|
          body = JSON.parse(req.body, symbolize_names: true)
          expect(body[:payment_method][:installments]).to eq(6)
        }
    end
  end

  describe '.create_transaction without currency' do
    let(:params_no_currency) do
      {
        acceptance_token: 'test_acceptance_token',
        amount_in_cents: 10000,
        customer_email: 'test@example.com',
        payment_method_type: 'CARD',
        payment_token: 'tok_test_12345',
        reference: 'ORDER-123',
        phone_number: '+573001234567',
        full_name: 'Test User',
        shipping_address: {},
        redirect_url: 'https://example.com/callback'
      }
    end

    before do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 201, body: { data: {} }.to_json)
    end

    it 'defaults to COP currency' do
      described_class.create_transaction(params_no_currency)

      expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
        .with { |req|
          body = JSON.parse(req.body, symbolize_names: true)
          expect(body[:currency]).to eq('COP')
        }
    end
  end

  describe 'edge cases for create_transaction' do
    let(:base_params) do
      {
        acceptance_token: 'test_acceptance_token',
        amount_in_cents: 10000,
        currency: 'USD',
        customer_email: 'test@example.com',
        payment_method_type: 'CARD',
        payment_token: 'tok_test_12345',
        reference: 'ORDER-123',
        phone_number: '+573001234567',
        full_name: 'Test User',
        shipping_address: {},
        redirect_url: 'https://example.com/callback'
      }
    end

    before do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 201, body: { data: {} }.to_json)
    end

    it 'handles different currencies' do
      described_class.create_transaction(base_params)

      expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
        .with { |req|
          body = JSON.parse(req.body, symbolize_names: true)
          expect(body[:currency]).to eq('USD')
        }
    end

    it 'includes shipping address in request' do
      params_with_address = base_params.merge(
        shipping_address: {
          address_line_1: 'Test Street 123',
          city: 'Medellin',
          region: 'Antioquia',
          country: 'CO'
        }
      )

      described_class.create_transaction(params_with_address)

      expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
        .with { |req|
          body = JSON.parse(req.body, symbolize_names: true)
          expect(body[:shipping_address][:address_line_1]).to eq('Test Street 123')
          expect(body[:shipping_address][:city]).to eq('Medellin')
        }
    end

    it 'includes customer data in request' do
      described_class.create_transaction(base_params)

      expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
        .with { |req|
          body = JSON.parse(req.body, symbolize_names: true)
          expect(body[:customer_data][:phone_number]).to eq('+573001234567')
          expect(body[:customer_data][:full_name]).to eq('Test User')
        }
    end

    it 'includes redirect_url in request' do
      described_class.create_transaction(base_params)

      expect(WebMock).to have_requested(:post, "#{base_url}/transactions")
        .with { |req|
          body = JSON.parse(req.body, symbolize_names: true)
          expect(body[:redirect_url]).to eq('https://example.com/callback')
        }
    end
  end

  describe 'signature generation edge cases' do
    it 'generates different signatures for different references' do
      sig1 = described_class.send(:generate_signature, 'REF-001', 10000, 'COP')
      sig2 = described_class.send(:generate_signature, 'REF-002', 10000, 'COP')

      expect(sig1).not_to eq(sig2)
    end

    it 'generates different signatures for different amounts' do
      sig1 = described_class.send(:generate_signature, 'REF-001', 10000, 'COP')
      sig2 = described_class.send(:generate_signature, 'REF-001', 20000, 'COP')

      expect(sig1).not_to eq(sig2)
    end

    it 'generates different signatures for different currencies' do
      sig1 = described_class.send(:generate_signature, 'REF-001', 10000, 'COP')
      sig2 = described_class.send(:generate_signature, 'REF-001', 10000, 'USD')

      expect(sig1).not_to eq(sig2)
    end

    it 'generates consistent signatures for same parameters' do
      sig1 = described_class.send(:generate_signature, 'REF-001', 10000, 'COP')
      sig2 = described_class.send(:generate_signature, 'REF-001', 10000, 'COP')

      expect(sig1).to eq(sig2)
    end

    it 'handles special characters in reference' do
      sig = described_class.send(:generate_signature, 'REF-$#@-001', 10000, 'COP')

      expect(sig).to be_a(String)
      expect(sig.length).to eq(64) # SHA256 hex digest length
    end
  end

  describe 'webhook signature validation edge cases' do
    it 'validates signature with special characters in payload' do
      payload = '{"event":"transaction.updated","data":{"status":"APPROVED"}}'
      timestamp = '1234567890'
      event_key = ENV['WOMPI_EVENT_KEY']

      expected_sig = Digest::SHA256.hexdigest("#{payload}#{timestamp}#{event_key}")

      result = described_class.validate_webhook_signature(payload, expected_sig, timestamp)

      expect(result).to be true
    end

    it 'rejects signature with different timestamp' do
      payload = '{"event":"test"}'
      timestamp1 = '1234567890'
      timestamp2 = '9876543210'
      event_key = ENV['WOMPI_EVENT_KEY']

      sig_with_ts1 = Digest::SHA256.hexdigest("#{payload}#{timestamp1}#{event_key}")

      result = described_class.validate_webhook_signature(payload, sig_with_ts1, timestamp2)

      expect(result).to be false
    end

    it 'rejects signature with modified payload' do
      payload1 = '{"event":"test"}'
      payload2 = '{"event":"modified"}'
      timestamp = '1234567890'
      event_key = ENV['WOMPI_EVENT_KEY']

      sig = Digest::SHA256.hexdigest("#{payload1}#{timestamp}#{event_key}")

      result = described_class.validate_webhook_signature(payload2, sig, timestamp)

      expect(result).to be false
    end

    it 'handles empty payload' do
      payload = ''
      timestamp = '1234567890'
      event_key = ENV['WOMPI_EVENT_KEY']

      expected_sig = Digest::SHA256.hexdigest("#{payload}#{timestamp}#{event_key}")

      result = described_class.validate_webhook_signature(payload, expected_sig, timestamp)

      expect(result).to be true
    end

    it 'handles very long payload' do
      payload = 'a' * 10000
      timestamp = '1234567890'
      event_key = ENV['WOMPI_EVENT_KEY']

      expected_sig = Digest::SHA256.hexdigest("#{payload}#{timestamp}#{event_key}")

      result = described_class.validate_webhook_signature(payload, expected_sig, timestamp)

      expect(result).to be true
    end
  end

  describe 'HTTP status code handling' do
    let(:params) do
      {
        acceptance_token: 'test',
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        payment_method_type: 'CARD',
        payment_token: 'tok_test',
        reference: 'ORDER-123',
        phone_number: '+573001234567',
        full_name: 'Test User',
        shipping_address: {},
        redirect_url: 'https://example.com/callback'
      }
    end

    it 'handles 401 Unauthorized' do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 401, body: { error: { type: 'unauthorized', message: 'Invalid credentials' } }.to_json)

      result = described_class.create_transaction(params)

      expect(result[:success]).to be false
      expect(result[:error][:type]).to eq('unauthorized')
    end

    it 'handles 403 Forbidden' do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 403, body: { error: { type: 'forbidden' } }.to_json)

      result = described_class.create_transaction(params)

      expect(result[:success]).to be false
      expect(result[:error][:type]).to eq('forbidden')
    end

    it 'handles 422 Unprocessable Entity' do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 422, body: { error: { type: 'validation_error', message: 'Invalid data' } }.to_json)

      result = described_class.create_transaction(params)

      expect(result[:success]).to be false
      expect(result[:error][:message]).to eq('Invalid data')
    end

    it 'handles 500 Internal Server Error' do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 500, body: { error: { type: 'server_error' } }.to_json)

      result = described_class.create_transaction(params)

      expect(result[:success]).to be false
    end

    it 'handles 503 Service Unavailable' do
      stub_request(:post, "#{base_url}/transactions")
        .to_return(status: 503, body: { error: { type: 'service_unavailable' } }.to_json)

      result = described_class.create_transaction(params)

      expect(result[:success]).to be false
    end
  end
end
