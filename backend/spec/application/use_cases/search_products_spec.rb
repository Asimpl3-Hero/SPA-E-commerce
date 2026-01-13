require 'spec_helper'
require_relative '../../../lib/application/use_cases/search_products'

RSpec.describe Application::UseCases::SearchProducts do
  let(:product_repository) { double('ProductRepository') }
  let(:use_case) { described_class.new(product_repository) }

  let(:product1) do
    instance_double(
      Domain::Entities::Product,
      name: 'Laptop',
      description: 'High performance laptop',
      category: 'Electronics',
      to_h: { 'id' => 1, 'name' => 'Laptop' }
    )
  end

  let(:product2) do
    instance_double(
      Domain::Entities::Product,
      name: 'Mouse',
      description: 'Wireless mouse',
      category: 'Electronics',
      to_h: { 'id' => 2, 'name' => 'Mouse' }
    )
  end

  describe '#call' do
    context 'when query is provided without category' do
      it 'searches products using repository' do
        allow(product_repository).to receive(:search)
          .with('laptop')
          .and_return([product1])

        result = use_case.call(query: 'laptop')

        expect(result).to be_success
        products = result.value![:products]
        expect(products.size).to eq(1)
        expect(products.first['name']).to eq('Laptop')
      end
    end

    context 'when query and category are provided' do
      it 'finds products by category and filters by query' do
        allow(product_repository).to receive(:find_by_category)
          .with('Electronics')
          .and_return([product1, product2])

        result = use_case.call(query: 'laptop', category: 'Electronics')

        expect(result).to be_success
        products = result.value![:products]
        expect(products.size).to eq(1)
        expect(products.first['name']).to eq('Laptop')
      end
    end

    context 'when query is empty' do
      it 'returns empty array' do
        result = use_case.call(query: '')

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end
    end

    context 'when query is only whitespace' do
      it 'returns empty array' do
        result = use_case.call(query: '   ')

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end
    end

    context 'when query is nil' do
      it 'returns empty array' do
        result = use_case.call(query: nil)

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end
    end

    context 'when category is empty string' do
      it 'searches without category filter' do
        allow(product_repository).to receive(:search)
          .with('laptop')
          .and_return([product1])

        result = use_case.call(query: 'laptop', category: '')

        expect(result).to be_success
        expect(result.value![:products].size).to eq(1)
      end
    end

    context 'when matching product name' do
      it 'includes product in results' do
        allow(product_repository).to receive(:find_by_category)
          .with('Electronics')
          .and_return([product1])

        result = use_case.call(query: 'LAPTOP', category: 'Electronics')

        expect(result).to be_success
        expect(result.value![:products].size).to eq(1)
      end
    end

    context 'when matching product description' do
      it 'includes product in results' do
        allow(product_repository).to receive(:find_by_category)
          .with('Electronics')
          .and_return([product1])

        result = use_case.call(query: 'performance', category: 'Electronics')

        expect(result).to be_success
        expect(result.value![:products].size).to eq(1)
      end
    end

    context 'when matching product category' do
      it 'includes product in results' do
        allow(product_repository).to receive(:find_by_category)
          .with('Electronics')
          .and_return([product1])

        result = use_case.call(query: 'elec', category: 'Electronics')

        expect(result).to be_success
        expect(result.value![:products].size).to eq(1)
      end
    end

    context 'when no products match query' do
      it 'returns empty array' do
        allow(product_repository).to receive(:search)
          .with('nonexistent')
          .and_return([])

        result = use_case.call(query: 'nonexistent')

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end
    end

    context 'when repository raises an error' do
      it 'returns failure with server error' do
        allow(product_repository).to receive(:search)
          .and_raise(StandardError.new('Database error'))

        result = use_case.call(query: 'laptop')

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
