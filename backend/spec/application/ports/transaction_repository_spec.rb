require 'spec_helper'
require_relative '../../../lib/application/ports/transaction_repository'

RSpec.describe Application::Ports::TransactionRepository do
  subject(:repository) { described_class.new }

  describe '#find_by_id' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_id(1) }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_wompi_id' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_wompi_id('wompi-123') }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_reference' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_reference('ORDER-123') }.to raise_error(NotImplementedError)
    end
  end

  describe '#create' do
    it 'raises NotImplementedError' do
      expect { repository.create({}) }.to raise_error(NotImplementedError)
    end
  end

  describe '#update' do
    it 'raises NotImplementedError' do
      expect { repository.update(1, {}) }.to raise_error(NotImplementedError)
    end
  end

  describe '#update_status' do
    it 'raises NotImplementedError' do
      expect { repository.update_status(1, 'APPROVED') }.to raise_error(NotImplementedError)
    end

    it 'accepts payment_data parameter' do
      expect { repository.update_status(1, 'APPROVED', payment_data: {}) }.to raise_error(NotImplementedError)
    end
  end
end
