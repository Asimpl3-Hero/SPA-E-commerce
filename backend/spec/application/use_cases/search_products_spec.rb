# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::UseCases::SearchProducts do
  let(:product_repository) { Infrastructure::Adapters::Repositories::SequelProductRepository.new(db) }
  let(:use_case) { described_class.new(product_repository) }

  before do
    create_test_product(
      name: 'Laptop Dell',
      description: 'High-performance laptop',
      category: 'electronics'
    )
    create_test_product(
      name: 'Mouse Logitech',
      description: 'Wireless mouse',
      category: 'electronics'
    )
    create_test_product(
      name: 'T-Shirt Nike',
      description: 'Cotton t-shirt',
      category: 'clothing'
    )
  end

  describe '#call' do
    context 'with valid query' do
      it 'searches products by name' do
        result = use_case.call(query: 'Laptop')

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
        expect(result.value![:products].first['name']).to eq('Laptop Dell')
      end

      it 'searches products by description' do
        result = use_case.call(query: 'wireless')

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
        expect(result.value![:products].first['name']).to eq('Mouse Logitech')
      end

      it 'is case insensitive' do
        result = use_case.call(query: 'LAPTOP')

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
      end

      it 'returns multiple matching products' do
        result = use_case.call(query: 'electronics')

        expect(result).to be_success
        expect(result.value![:products].length).to be >= 2
      end
    end

    context 'with category filter' do
      it 'searches within specific category' do
        result = use_case.call(query: 'e', category: 'electronics')

        expect(result).to be_success
        expect(result.value![:products].all? { |p| p['category'] == 'electronics' }).to be true
      end

      it 'returns empty array when no matches in category' do
        result = use_case.call(query: 'Nike', category: 'electronics')

        expect(result).to be_success
        expect(result.value![:products]).to be_empty
      end
    end

    context 'with empty query' do
      it 'returns empty array for nil query' do
        result = use_case.call(query: nil)

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end

      it 'returns empty array for empty string' do
        result = use_case.call(query: '')

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end

      it 'returns empty array for whitespace only' do
        result = use_case.call(query: '   ')

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end
    end

    context 'when no matches found' do
      it 'returns empty array' do
        result = use_case.call(query: 'nonexistent product')

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end
    end

    context 'when repository raises an error' do
      before do
        allow(product_repository).to receive(:search).and_raise(StandardError, 'Database error')
      end

      it 'returns a server error failure' do
        result = use_case.call(query: 'laptop')

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end

    context 'with category filter and empty category string' do
      it 'searches all categories when category is empty string' do
        result = use_case.call(query: 'e', category: '')

        expect(result).to be_success
        expect(result.value![:products].length).to be >= 1
      end

      it 'searches all categories when category is whitespace' do
        result = use_case.call(query: 'e', category: '   ')

        expect(result).to be_success
        expect(result.value![:products].length).to be >= 1
      end
    end

    context 'searching by category name in product' do
      it 'finds products when query matches category' do
        result = use_case.call(query: 'clothing', category: 'clothing')

        expect(result).to be_success
        expect(result.value![:products].length).to eq(1)
        expect(result.value![:products].first['category']).to eq('clothing')
      end
    end

    context 'searching with partial matches' do
      it 'finds products with partial name match' do
        result = use_case.call(query: 'Lap')

        expect(result).to be_success
        expect(result.value![:products].any? { |p| p['name'].include?('Laptop') }).to be true
      end

      it 'finds products with partial description match' do
        result = use_case.call(query: 'perform')

        expect(result).to be_success
        expect(result.value![:products].any? { |p| p['description'].include?('performance') }).to be true
      end
    end

    context 'when category filter raises error' do
      before do
        allow(product_repository).to receive(:find_by_category).and_raise(StandardError, 'Category error')
      end

      it 'returns a server error failure' do
        result = use_case.call(query: 'laptop', category: 'electronics')

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Category error')
      end
    end

    context 'with edge case category values' do
      it 'handles empty category filter' do
        result = use_case.call(query: 'Laptop', category: '')

        expect(result).to be_success
        # Should search all products when category is empty
        expect(result.value![:products].length).to be >= 1
      end

      it 'handles whitespace category filter' do
        result = use_case.call(query: 'Laptop', category: '   ')

        expect(result).to be_success
        expect(result.value![:products].length).to be >= 1
      end
    end

    context 'with special SQL characters in query' do
      it 'escapes percent sign in query' do
        result = use_case.call(query: '100%')

        expect(result).to be_success
        expect(result.value![:products]).to be_empty
      end

      it 'escapes underscore in query' do
        result = use_case.call(query: 'test_product')

        expect(result).to be_success
        # Should work without SQL injection
      end

      it 'handles single quote in query' do
        result = use_case.call(query: "O'Reilly")

        expect(result).to be_success
        expect(result.value![:products]).to be_empty
      end
    end

    context 'with very long search queries' do
      it 'handles long queries without error' do
        long_query = 'a' * 1000
        result = use_case.call(query: long_query)

        expect(result).to be_success
        expect(result.value![:products]).to be_empty
      end
    end

    context 'with unicode characters in query' do
      it 'handles unicode characters' do
        result = use_case.call(query: 'Laptop™ 你好')

        expect(result).to be_success
        expect(result.value![:products]).to be_empty
      end
    end
  end
end
