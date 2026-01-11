# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::UseCases::GetProductById do
  let(:product_repository) { Infrastructure::Adapters::Repositories::SequelProductRepository.new(db) }
  let(:use_case) { described_class.new(product_repository) }

  describe '#call' do
    context 'when product exists' do
      let(:product_id) { create_test_product(name: 'Test Product', price: 10000) }

      it 'returns the product' do
        result = use_case.call(product_id)

        expect(result).to be_success
        expect(result.value![:id]).to eq(product_id)
        expect(result.value![:name]).to eq('Test Product')
      end

      it 'returns product as hash' do
        result = use_case.call(product_id)

        expect(result.value!).to be_a(Hash)
        expect(result.value!).to have_key(:price)
        expect(result.value!).to have_key(:category)
        expect(result.value!).to have_key(:stock)
      end
    end

    context 'when product does not exist' do
      it 'returns not found failure' do
        result = use_case.call(99999)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:not_found)
        expect(result.failure[:message]).to include('not found')
      end
    end

    context 'with invalid id' do
      it 'returns validation error for nil' do
        result = use_case.call(nil)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Invalid product ID')
      end

      it 'returns validation error for zero' do
        result = use_case.call(0)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
      end

      it 'returns validation error for negative number' do
        result = use_case.call(-1)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
      end
    end

    context 'when repository raises an error' do
      before do
        allow(product_repository).to receive(:find_by_id).and_raise(StandardError, 'Database error')
      end

      it 'returns a server error failure' do
        result = use_case.call(1)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
