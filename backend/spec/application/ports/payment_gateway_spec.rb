require 'spec_helper'
require_relative '../../../lib/application/ports/payment_gateway'

RSpec.describe Application::Ports::PaymentGateway do
  subject(:gateway) { described_class.new }

  describe '#get_acceptance_token' do
    it 'raises NotImplementedError' do
      expect { gateway.get_acceptance_token }.to raise_error(NotImplementedError)
    end
  end

  describe '#create_transaction' do
    it 'raises NotImplementedError' do
      expect { gateway.create_transaction({}) }.to raise_error(NotImplementedError)
    end
  end

  describe '#get_transaction' do
    it 'raises NotImplementedError' do
      expect { gateway.get_transaction('trans-123') }.to raise_error(NotImplementedError)
    end
  end

  describe '#validate_webhook_signature' do
    it 'raises NotImplementedError' do
      expect { gateway.validate_webhook_signature('payload', 'signature', 'timestamp') }.to raise_error(NotImplementedError)
    end
  end
end
