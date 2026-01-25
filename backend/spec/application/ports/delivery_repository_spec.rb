require 'spec_helper'
require_relative '../../../lib/application/ports/delivery_repository'

RSpec.describe Application::Ports::DeliveryRepository do
  subject(:repository) { described_class.new }

  describe '#find_by_id' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_id(1) }.to raise_error(NotImplementedError)
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
      expect { repository.update_status(1, 'assigned') }.to raise_error(NotImplementedError)
    end

    it 'accepts estimated_delivery_date parameter' do
      expect { repository.update_status(1, 'assigned', estimated_delivery_date: Time.now) }.to raise_error(NotImplementedError)
    end
  end
end
