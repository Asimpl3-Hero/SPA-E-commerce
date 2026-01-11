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
  end
end
