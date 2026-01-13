require 'spec_helper'
require_relative '../../../lib/application/ports/product_repository'

RSpec.describe Application::Ports::ProductRepository do
  subject(:repository) { described_class.new }

  describe '#find_all' do
    it 'raises NotImplementedError' do
      expect { repository.find_all }.to raise_error(NotImplementedError)
    end

    it 'accepts filters parameter' do
      expect { repository.find_all(filters: {}) }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_id' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_id(1) }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_category' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_category('Electronics') }.to raise_error(NotImplementedError)
    end
  end

  describe '#search' do
    it 'raises NotImplementedError' do
      expect { repository.search('query') }.to raise_error(NotImplementedError)
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

  describe '#delete' do
    it 'raises NotImplementedError' do
      expect { repository.delete(1) }.to raise_error(NotImplementedError)
    end
  end

  describe '#count' do
    it 'raises NotImplementedError' do
      expect { repository.count }.to raise_error(NotImplementedError)
    end
  end
end
