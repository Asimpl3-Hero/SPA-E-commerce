require 'spec_helper'
require_relative '../../../lib/application/use_cases/get_all_products'

RSpec.describe Application::UseCases::GetAllProducts do
  let(:product_repository) { double('ProductRepository') }
  let(:use_case) { described_class.new(product_repository) }

  let(:product1) do
    instance_double(
      Domain::Entities::Product,
      to_h: { 'id' => 1, 'name' => 'Product 1', 'price' => 100.0 }
    )
  end

  let(:product2) do
    instance_double(
      Domain::Entities::Product,
      to_h: { 'id' => 2, 'name' => 'Product 2', 'price' => 200.0 }
    )
  end

  describe '#call' do
    context 'when repository returns products successfully' do
      it 'returns success with products array' do
        allow(product_repository).to receive(:find_all)
          .with(filters: {})
          .and_return([product1, product2])

        result = use_case.call

        expect(result).to be_success
        products = result.value![:products]
        expect(products).to be_an(Array)
        expect(products.size).to eq(2)
        expect(products.first['id']).to eq(1)
        expect(products.last['id']).to eq(2)
      end
    end

    context 'when filters are provided' do
      it 'passes filters to repository' do
        filters = { category: 'Electronics', max_price: 500 }
        allow(product_repository).to receive(:find_all)
          .with(filters: filters)
          .and_return([product1])

        result = use_case.call(filters: filters)

        expect(result).to be_success
        expect(result.value![:products].size).to eq(1)
      end
    end

    context 'when no products are found' do
      it 'returns success with empty array' do
        allow(product_repository).to receive(:find_all)
          .with(filters: {})
          .and_return([])

        result = use_case.call

        expect(result).to be_success
        expect(result.value![:products]).to eq([])
      end
    end

    context 'when repository raises an error' do
      it 'returns failure with error message' do
        allow(product_repository).to receive(:find_all)
          .and_raise(StandardError.new('Database error'))

        result = use_case.call

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
