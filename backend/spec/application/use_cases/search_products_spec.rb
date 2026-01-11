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
        expect(result.value!.length).to eq(1)
        expect(result.value!.first[:name]).to eq('Laptop Dell')
      end

      it 'searches products by description' do
        result = use_case.call(query: 'wireless')

        expect(result).to be_success
        expect(result.value!.length).to eq(1)
        expect(result.value!.first[:name]).to eq('Mouse Logitech')
      end

      it 'is case insensitive' do
        result = use_case.call(query: 'LAPTOP')

        expect(result).to be_success
        expect(result.value!.length).to eq(1)
      end

      it 'returns multiple matching products' do
        result = use_case.call(query: 'electronics')

        expect(result).to be_success
        expect(result.value!.length).to be >= 2
      end
    end

    context 'with category filter' do
      it 'searches within specific category' do
        result = use_case.call(query: 'e', category: 'electronics')

        expect(result).to be_success
        expect(result.value!.all? { |p| p[:category] == 'electronics' }).to be true
      end

      it 'returns empty array when no matches in category' do
        result = use_case.call(query: 'Nike', category: 'electronics')

        expect(result).to be_success
        expect(result.value!).to be_empty
      end
    end

    context 'with empty query' do
      it 'returns empty array for nil query' do
        result = use_case.call(query: nil)

        expect(result).to be_success
        expect(result.value!).to eq([])
      end

      it 'returns empty array for empty string' do
        result = use_case.call(query: '')

        expect(result).to be_success
        expect(result.value!).to eq([])
      end

      it 'returns empty array for whitespace only' do
        result = use_case.call(query: '   ')

        expect(result).to be_success
        expect(result.value!).to eq([])
      end
    end

    context 'when no matches found' do
      it 'returns empty array' do
        result = use_case.call(query: 'nonexistent product')

        expect(result).to be_success
        expect(result.value!).to eq([])
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
  end
end
