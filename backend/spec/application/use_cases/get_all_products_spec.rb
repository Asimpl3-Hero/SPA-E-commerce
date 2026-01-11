# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::UseCases::GetAllProducts do
  let(:product_repository) { Infrastructure::Adapters::Repositories::SequelProductRepository.new(db) }
  let(:use_case) { described_class.new(product_repository) }

  before do
    create_test_product(name: 'Product 1', price: 10000, category: 'electronics')
    create_test_product(name: 'Product 2', price: 20000, category: 'clothing')
    create_test_product(name: 'Product 3', price: 30000, category: 'electronics')
  end

  describe '#call' do
    context 'without filters' do
      it 'returns all products' do
        result = use_case.call

        expect(result).to be_success
        expect(result.value!.length).to eq(3)
      end

      it 'returns products as hashes' do
        result = use_case.call

        product = result.value!.first
        expect(product).to be_a(Hash)
        expect(product).to have_key(:id)
        expect(product).to have_key(:name)
        expect(product).to have_key(:price)
        expect(product).to have_key(:category)
      end
    end

    context 'with category filter' do
      it 'returns only products from specified category' do
        result = use_case.call(filters: { category: 'electronics' })

        expect(result).to be_success
        expect(result.value!.length).to eq(2)
        expect(result.value!.all? { |p| p[:category] == 'electronics' }).to be true
      end
    end

    context 'with limit filter' do
      it 'limits the number of results' do
        result = use_case.call(filters: { limit: 2 })

        expect(result).to be_success
        expect(result.value!.length).to eq(2)
      end
    end

    context 'with offset filter' do
      it 'offsets the results' do
        result = use_case.call(filters: { offset: 1 })

        expect(result).to be_success
        expect(result.value!.length).to eq(2)
      end
    end

    context 'when repository raises an error' do
      before do
        allow(product_repository).to receive(:find_all).and_raise(StandardError, 'Database error')
      end

      it 'returns a failure result' do
        result = use_case.call

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
