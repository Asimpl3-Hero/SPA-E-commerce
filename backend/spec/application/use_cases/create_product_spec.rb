# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::UseCases::CreateProduct do
  let(:product_repository) { Infrastructure::Adapters::Repositories::SequelProductRepository.new(db) }
  let(:use_case) { described_class.new(product_repository) }

  let(:valid_product_data) do
    {
      name: 'New Product',
      description: 'Product description',
      price: 10000,
      category: 'electronics',
      image: 'https://example.com/image.jpg',
      stock: 10
    }
  end

  describe '#call' do
    context 'with valid data' do
      it 'creates a product' do
        expect {
          use_case.call(valid_product_data)
        }.to change { db[:products].count }.by(1)
      end

      it 'returns success with product data' do
        result = use_case.call(valid_product_data)

        expect(result).to be_success
        expect(result.value!).to be_a(Hash)
        expect(result.value![:name]).to eq('New Product')
        expect(result.value![:price]).to eq(10000)
      end

      it 'returns product with id' do
        result = use_case.call(valid_product_data)

        expect(result.value![:id]).not_to be_nil
        expect(result.value![:id]).to be_a(Integer)
      end
    end

    context 'with missing required fields' do
      it 'fails when name is missing' do
        data = valid_product_data.dup
        data.delete(:name)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Missing required fields')
        expect(result.failure[:details][:missing]).to include(:name)
      end

      it 'fails when price is missing' do
        data = valid_product_data.dup
        data.delete(:price)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:price)
      end

      it 'fails when category is missing' do
        data = valid_product_data.dup
        data.delete(:category)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:category)
      end

      it 'fails when description is missing' do
        data = valid_product_data.dup
        data.delete(:description)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:description)
      end

      it 'fails when image is missing' do
        data = valid_product_data.dup
        data.delete(:image)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:image)
      end

      it 'fails when multiple fields are missing' do
        result = use_case.call({})

        expect(result).to be_failure
        expect(result.failure[:details][:missing].length).to eq(5)
      end
    end

    context 'with empty field values' do
      it 'fails when name is empty string' do
        data = valid_product_data.merge(name: '')

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:name)
      end

      it 'fails when name is whitespace only' do
        data = valid_product_data.merge(name: '   ')

        result = use_case.call(data)

        expect(result).to be_failure
      end
    end

    context 'with invalid price' do
      it 'fails when price is zero' do
        data = valid_product_data.merge(price: 0)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Price must be greater than 0')
      end

      it 'fails when price is negative' do
        data = valid_product_data.merge(price: -100)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:message]).to eq('Price must be greater than 0')
      end
    end

    context 'with original_price' do
      it 'succeeds when original_price is greater than price' do
        data = valid_product_data.merge(original_price: 15000)

        result = use_case.call(data)

        expect(result).to be_success
      end

      it 'fails when original_price equals price' do
        data = valid_product_data.merge(original_price: 10000)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:message]).to eq('Original price must be greater than price')
      end

      it 'fails when original_price is less than price' do
        data = valid_product_data.merge(original_price: 5000)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:message]).to eq('Original price must be greater than price')
      end
    end

    context 'when repository raises an error' do
      before do
        allow(product_repository).to receive(:create).and_raise(StandardError, 'Database error')
      end

      it 'returns a server error failure' do
        result = use_case.call(valid_product_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
