require 'spec_helper'
require_relative '../../../lib/application/ports/category_repository'

RSpec.describe Application::Ports::CategoryRepository do
  subject(:repository) { described_class.new }

  describe '#find_all' do
    it 'raises NotImplementedError' do
      expect { repository.find_all }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_id' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_id(1) }.to raise_error(NotImplementedError)
    end
  end

  describe '#find_by_slug' do
    it 'raises NotImplementedError' do
      expect { repository.find_by_slug('electronics') }.to raise_error(NotImplementedError)
    end
  end

  describe '#create' do
    it 'raises NotImplementedError' do
      expect { repository.create({}) }.to raise_error(NotImplementedError)
    end
  end
end
