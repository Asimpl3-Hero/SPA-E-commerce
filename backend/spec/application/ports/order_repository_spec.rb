require 'spec_helper'
require_relative '../../../lib/application/ports/order_repository'

RSpec.describe Application::Ports::OrderRepository do
  subject(:repository) { described_class.new }

  describe '#find_by_id' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_id(1) }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_reference' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_reference('ORDER-123') }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_with_details' do
    it 'raises NotImplementedError' do
      expect { repository.find_with_details('ORDER-123') }.to raise_error(NotImplementedError)
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
      expect { repository.update_status(1, 'approved') }.to raise_error(NotImplementedError)
    end
  end

  describe '#update_transaction' do
    it 'raises NotImplementedError' do
      expect { repository.update_transaction(1, 10, 'approved') }.to raise_error(NotImplementedError)
    end
  end
end
