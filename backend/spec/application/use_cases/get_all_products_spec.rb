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
        expect(result.value![:products].length).to eq(3)
      end

      it 'returns products as hashes' do
        result = use_case.call

        product = result.value![:products].first
        expect(product).to be_a(Hash)
        expect(product).to have_key('id')
        expect(product).to have_key('name')
        expect(product).to have_key('price')
        expect(product).to have_key('category')
      end
    end

    context 'with category filter' do
      it 'returns only products from specified category' do
        result = use_case.call(filters: { category: 'electronics' })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(2)
        expect(result.value![:products].all? { |p| p['category'] == 'electronics' }).to be true
      end
    end

    context 'with limit filter' do
      it 'limits the number of results' do
        result = use_case.call(filters: { limit: 2 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(2)
      end
    end

    context 'with offset filter' do
      it 'offsets the results' do
        result = use_case.call(filters: { offset: 1 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(2)
      end
    end

    context 'with price range filters' do
      it 'filters by minimum price' do
        result = use_case.call(filters: { min_price: 15000 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(2)
        expect(result.value![:products].all? { |p| p['price'] >= 15000 }).to be true
      end

      it 'filters by maximum price' do
        result = use_case.call(filters: { max_price: 25000 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(2)
        expect(result.value![:products].all? { |p| p['price'] <= 25000 }).to be true
      end

      it 'filters by both min and max price' do
        result = use_case.call(filters: { min_price: 15000, max_price: 25000 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
        expect(result.value![:products].first['price']).to eq(20000)
      end

      it 'handles zero min price' do
        result = use_case.call(filters: { min_price: 0 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(3)
      end

      it 'handles negative price filters' do
        result = use_case.call(filters: { min_price: -100 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(3)
      end
    end

    context 'with combined filters' do
      it 'combines category and price filters' do
        result = use_case.call(filters: { category: 'electronics', min_price: 15000 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
        expect(result.value![:products].first['name']).to eq('Product 3')
      end

      it 'combines all filters together' do
        result = use_case.call(filters: {
          category: 'electronics',
          min_price: 5000,
          max_price: 35000,
          limit: 1,
          offset: 0
        })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
      end

      it 'applies limit and offset together' do
        result = use_case.call(filters: { limit: 1, offset: 1 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
        expect(result.value![:products].first['name']).to eq('Product 2')
      end
    end

    context 'with sorting' do
      it 'sorts by price ascending' do
        result = use_case.call(filters: { sort_by: :price })

        expect(result).to be_success
        prices = result.value![:products].map { |p| p['price'] }
        expect(prices).to eq([10000, 20000, 30000])
      end

      it 'sorts by name' do
        result = use_case.call(filters: { sort_by: :name })

        expect(result).to be_success
        names = result.value![:products].map { |p| p['name'] }
        expect(names).to eq(['Product 1', 'Product 2', 'Product 3'])
      end
    end

    context 'with edge case filters' do
      it 'rejects limit of 0' do
        result = use_case.call(filters: { limit: 0 })

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
      end

      it 'handles very large limit' do
        result = use_case.call(filters: { limit: 1000000 })

        expect(result).to be_success
        expect(result.value![:products].length).to eq(3)
      end

      it 'handles offset exceeding total records' do
        result = use_case.call(filters: { offset: 100 })

        expect(result).to be_success
        expect(result.value![:products]).to be_empty
      end

      it 'handles empty filters hash' do
        result = use_case.call(filters: {})

        expect(result).to be_success
        expect(result.value![:products].length).to eq(3)
      end

      it 'rejects nil filters' do
        result = use_case.call(filters: nil)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
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
