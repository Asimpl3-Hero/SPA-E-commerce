require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/payment/wompi_payment_gateway'
require_relative '../../../../lib/infrastructure/adapters/payment/wompi_service'

RSpec.describe Infrastructure::Adapters::Payment::WompiPaymentGateway do
  let(:gateway) { described_class.new }

  describe '#get_acceptance_token' do
    it 'delegates to WompiService' do
      acceptance_token = { acceptance_token: 'token_123' }

      allow(Infrastructure::Adapters::Payment::WompiService).to receive(:get_acceptance_token)
        .and_return(acceptance_token)

      result = gateway.get_acceptance_token

      expect(result).to eq(acceptance_token)
    end
  end

  describe '#create_transaction' do
    let(:params) do
      {
        acceptance_token: 'token_123',
        amount_in_cents: 10000,
        currency: 'COP',
        customer_email: 'test@example.com',
        reference: 'ORDER-123'
      }
    end

    it 'delegates to WompiService' do
      response = { success: true, data: { data: { id: 'trans-123' } } }

      allow(Infrastructure::Adapters::Payment::WompiService).to receive(:create_transaction)
        .with(params)
        .and_return(response)

      result = gateway.create_transaction(params)

      expect(result).to eq(response)
    end
  end

  describe '#get_transaction' do
    it 'delegates to WompiService' do
      response = { success: true, data: { data: { id: 'trans-123', status: 'APPROVED' } } }

      allow(Infrastructure::Adapters::Payment::WompiService).to receive(:get_transaction)
        .with('trans-123')
        .and_return(response)

      result = gateway.get_transaction('trans-123')

      expect(result).to eq(response)
    end
  end

  describe '#validate_webhook_signature' do
    let(:payload) { '{"event":"transaction.updated"}' }
    let(:signature) { 'valid_signature' }
    let(:timestamp) { '1234567890' }

    it 'delegates to WompiService' do
      allow(Infrastructure::Adapters::Payment::WompiService).to receive(:validate_webhook_signature)
        .with(payload, signature, timestamp)
        .and_return(true)

      result = gateway.validate_webhook_signature(payload, signature, timestamp)

      expect(result).to be(true)
    end
  end
end
