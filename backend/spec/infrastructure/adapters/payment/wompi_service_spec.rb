require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/payment/wompi_service'

RSpec.describe Infrastructure::Adapters::Payment::WompiService do
  # Use real ENV variables from .env file
  let(:base_url) { ENV['WOMPI_SANDBOX_URL'] }
  let(:private_key) { ENV['WOMPI_PRIVATE_KEY'] }
  let(:public_key) { ENV['WOMPI_PUBLIC_KEY'] }
  let(:integrity_key) { ENV['WOMPI_INTEGRITY_KEY'] }
  let(:event_key) { ENV['WOMPI_EVENT_KEY'] }

  describe '.create_transaction' do
    let(:transaction_params) do
      {
        acceptance_token: 'test_token',
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        phone_number: '1234567890',
        full_name: 'Test User',
        payment_method_type: 'CARD',
        payment_token: 'card_token',
        reference: 'ORDER-123',
        redirect_url: 'http://example.com/confirmation'
      }
    end

    let(:success_response) do
      {
        data: {
          id: 'trans-123',
          status: 'APPROVED',
          reference: 'ORDER-123',
          amount_in_cents: 10000,
          currency: 'COP'
        }
      }
    end

    context 'when transaction is successful' do
      it 'returns success with transaction data' do
        stub_request(:post, "#{base_url}/transactions")
          .to_return(status: 200, body: success_response.to_json, headers: { 'Content-Type' => 'application/json' })

        result = described_class.create_transaction(transaction_params)

        expect(result[:success]).to be(true)
        expect(result[:data][:data][:id]).to eq('trans-123')
        expect(result[:data][:data][:status]).to eq('APPROVED')
      end
    end

    context 'when transaction fails' do
      it 'returns failure with error' do
        error_response = {
          error: {
            type: 'CARD_DECLINED',
            message: 'Card was declined'
          }
        }

        stub_request(:post, "#{base_url}/transactions")
          .to_return(status: 400, body: error_response.to_json, headers: { 'Content-Type' => 'application/json' })

        result = described_class.create_transaction(transaction_params)

        expect(result[:success]).to be(false)
        expect(result[:error][:type]).to eq('CARD_DECLINED')
        expect(result[:error][:message]).to eq('Card was declined')
      end
    end

    context 'with NEQUI payment method' do
      it 'sends phone_number in payment_method' do
        nequi_params = transaction_params.merge(
          payment_method_type: 'NEQUI',
          nequi_phone_number: '3001234567'
        )
        nequi_params.delete(:payment_token)

        stub_request(:post, "#{base_url}/transactions")
          .to_return(status: 200, body: success_response.to_json, headers: { 'Content-Type' => 'application/json' })

        result = described_class.create_transaction(nequi_params)

        expect(result[:success]).to be(true)
      end
    end

    context 'when response is invalid JSON' do
      it 'returns parse error' do
        stub_request(:post, "#{base_url}/transactions")
          .to_return(status: 200, body: 'invalid json')

        result = described_class.create_transaction(transaction_params)

        expect(result[:success]).to be(false)
        expect(result[:error][:type]).to eq('parse_error')
      end
    end
  end

  describe '.get_acceptance_token' do
    let(:acceptance_response) do
      {
        data: {
          presigned_acceptance: {
            acceptance_token: 'token_123',
            permalink: 'https://wompi.co/terms'
          }
        }
      }
    end

    context 'when request is successful' do
      it 'returns acceptance token' do
        stub_request(:get, "#{base_url}/merchants/#{public_key}")
          .to_return(status: 200, body: acceptance_response.to_json, headers: { 'Content-Type' => 'application/json' })

        result = described_class.get_acceptance_token

        expect(result[:acceptance_token]).to eq('token_123')
        expect(result[:permalink]).to eq('https://wompi.co/terms')
      end
    end

    context 'when request fails' do
      it 'returns nil' do
        stub_request(:get, "#{base_url}/merchants/#{public_key}")
          .to_return(status: 404, body: { error: 'Not found' }.to_json)

        result = described_class.get_acceptance_token

        expect(result).to be_nil
      end
    end
  end

  describe '.get_transaction' do
    let(:transaction_id) { 'trans-123' }
    let(:transaction_response) do
      {
        data: {
          id: transaction_id,
          status: 'APPROVED',
          amount_in_cents: 10000
        }
      }
    end

    context 'when transaction exists' do
      it 'returns transaction data' do
        stub_request(:get, "#{base_url}/transactions/#{transaction_id}")
          .to_return(status: 200, body: transaction_response.to_json, headers: { 'Content-Type' => 'application/json' })

        result = described_class.get_transaction(transaction_id)

        expect(result[:success]).to be(true)
        expect(result[:data][:data][:id]).to eq(transaction_id)
        expect(result[:data][:data][:status]).to eq('APPROVED')
      end
    end

    context 'when transaction not found' do
      it 'returns failure' do
        stub_request(:get, "#{base_url}/transactions/#{transaction_id}")
          .to_return(status: 404, body: { error: 'Not found' }.to_json)

        result = described_class.get_transaction(transaction_id)

        expect(result[:success]).to be(false)
      end
    end
  end

  describe '.validate_webhook_signature' do
    let(:payload) { '{"event":"transaction.updated"}' }
    let(:timestamp) { '1234567890' }

    context 'with valid signature' do
      it 'returns true' do
        expected_data = "#{payload}#{timestamp}#{event_key}"
        valid_signature = Digest::SHA256.hexdigest(expected_data)

        result = described_class.validate_webhook_signature(payload, valid_signature, timestamp)

        expect(result).to be(true)
      end
    end

    context 'with invalid signature' do
      it 'returns false' do
        invalid_signature = 'invalid_signature'

        result = described_class.validate_webhook_signature(payload, invalid_signature, timestamp)

        expect(result).to be(false)
      end
    end
  end
end
