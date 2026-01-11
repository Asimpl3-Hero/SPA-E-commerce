# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::UseCases::GetAllCategories do
  let(:product_repository) { Infrastructure::Adapters::Repositories::SequelProductRepository.new(db) }
  let(:use_case) { described_class.new(product_repository) }

  describe '#call' do
    context 'with products in database' do
      before do
        create_test_product(category: 'electronics')
        create_test_product(category: 'electronics')
        create_test_product(category: 'clothing')
        create_test_product(category: 'books')
        create_test_product(category: 'clothing')
      end

      it 'returns unique categories' do
        result = use_case.call

        expect(result).to be_success
        expect(result.value!.length).to eq(3)
        expect(result.value!).to contain_exactly('books', 'clothing', 'electronics')
      end

      it 'returns sorted categories' do
        result = use_case.call

        expect(result).to be_success
        expect(result.value!).to eq(result.value!.sort)
      end

      it 'returns categories as array of strings' do
        result = use_case.call

        expect(result.value!).to be_an(Array)
        expect(result.value!.all? { |c| c.is_a?(String) }).to be true
      end
    end

    context 'with no products' do
      it 'returns empty array' do
        result = use_case.call

        expect(result).to be_success
        expect(result.value!).to eq([])
      end
    end

    context 'when repository raises an error' do
      before do
        create_test_product # Create at least one product
        allow(product_repository).to receive(:find_all).and_raise(StandardError, 'Database error')
      end

      it 'returns a server error failure' do
        result = use_case.call

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
