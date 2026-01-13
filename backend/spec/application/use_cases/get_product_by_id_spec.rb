require 'spec_helper'
require_relative '../../../lib/application/use_cases/get_product_by_id'

RSpec.describe Application::UseCases::GetProductById do
  let(:product_repository) { double('ProductRepository') }
  let(:use_case) { described_class.new(product_repository) }

  let(:product) do
    instance_double(
      Domain::Entities::Product,
      to_h: { 'id' => 1, 'name' => 'Test Product', 'price' => 100.0 }
    )
  end

  describe '#call' do
    context 'when product exists' do
      it 'returns success with product hash' do
        allow(product_repository).to receive(:find_by_id)
          .with(1)
          .and_return(product)

        result = use_case.call(1)

        expect(result).to be_success
        expect(result.value!['id']).to eq(1)
        expect(result.value!['name']).to eq('Test Product')
      end
    end

    context 'when product does not exist' do
      it 'returns failure with not found error' do
        allow(product_repository).to receive(:find_by_id)
          .with(999)
          .and_return(nil)

        result = use_case.call(999)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:not_found)
        expect(result.failure[:message]).to eq('Product with id 999 not found')
      end
    end

    context 'when id is nil' do
      it 'returns failure with validation error' do
        result = use_case.call(nil)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Invalid product ID')
      end
    end

    context 'when id is zero' do
      it 'returns failure with validation error' do
        result = use_case.call(0)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Invalid product ID')
      end
    end

    context 'when id is negative' do
      it 'returns failure with validation error' do
        result = use_case.call(-1)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Invalid product ID')
      end
    end

    context 'when id is a string' do
      it 'converts to integer and finds product' do
        allow(product_repository).to receive(:find_by_id)
          .with(1)
          .and_return(product)

        result = use_case.call('1')

        expect(result).to be_success
        expect(result.value!['id']).to eq(1)
      end
    end

    context 'when repository raises an error' do
      it 'returns failure with server error' do
        allow(product_repository).to receive(:find_by_id)
          .and_raise(StandardError.new('Database connection failed'))

        result = use_case.call(1)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database connection failed')
      end
    end
  end
end
