require 'spec_helper'
require_relative '../../../lib/application/ports/customer_repository'

RSpec.describe Application::Ports::CustomerRepository do
  subject(:repository) { described_class.new }

  describe '#find_by_id' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_id(1) }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_email' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_email('test@example.com') }.to raise_error(NotImplementedError)
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

  describe '#create_or_update_by_email' do
    it 'raises NotImplementedError' do
      expect { repository.create_or_update_by_email({}) }.to raise_error(NotImplementedError)
    end
  end
end
