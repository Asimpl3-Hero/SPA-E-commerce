require 'spec_helper'
require_relative '../../../lib/application/use_cases/create_product'

RSpec.describe Application::UseCases::CreateProduct do
  let(:product_repository) { double('ProductRepository') }
  let(:use_case) { described_class.new(product_repository) }

  let(:valid_product_data) do
    {
      name: 'Test Product',
      price: 100.0,
      category: 'Electronics',
      description: 'A test product',
      image: 'test.jpg'
    }
  end

  let(:created_product) do
    instance_double(
      Domain::Entities::Product,
      to_h: valid_product_data.merge('id' => 1)
    )
  end

  describe '#call' do
    context 'with valid product data' do
      it 'creates product and returns success' do
        allow(product_repository).to receive(:create)
          .with(valid_product_data)
          .and_return(created_product)

        result = use_case.call(valid_product_data)

        expect(result).to be_success
        expect(result.value!['id']).to eq(1)
        expect(result.value![:name]).to eq('Test Product')
      end
    end

    context 'with optional fields' do
      it 'creates product with all fields' do
        data = valid_product_data.merge(
          original_price: 150.0,
          rating: 4.5,
          reviews: 10,
          badge_text: 'New',
          badge_variant: 'primary',
          stock: 50
        )

        allow(product_repository).to receive(:create)
          .with(data)
          .and_return(created_product)

        result = use_case.call(data)

        expect(result).to be_success
      end
    end

    context 'when name is missing' do
      it 'returns validation error' do
        data = valid_product_data.dup
        data.delete(:name)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Missing required fields')
        expect(result.failure[:details][:missing]).to include(:name)
      end
    end

    context 'when name is empty string' do
      it 'returns validation error' do
        data = valid_product_data.merge(name: '')

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:details][:missing]).to include(:name)
      end
    end

    context 'when name is whitespace only' do
      it 'returns validation error' do
        data = valid_product_data.merge(name: '   ')

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:details][:missing]).to include(:name)
      end
    end

    context 'when price is missing' do
      it 'returns validation error' do
        data = valid_product_data.dup
        data.delete(:price)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:details][:missing]).to include(:price)
      end
    end

    context 'when price is zero' do
      it 'returns validation error' do
        data = valid_product_data.merge(price: 0)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Price must be greater than 0')
      end
    end

    context 'when price is negative' do
      it 'returns validation error' do
        data = valid_product_data.merge(price: -10)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Price must be greater than 0')
      end
    end

    context 'when category is missing' do
      it 'returns validation error' do
        data = valid_product_data.dup
        data.delete(:category)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:category)
      end
    end

    context 'when description is missing' do
      it 'returns validation error' do
        data = valid_product_data.dup
        data.delete(:description)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:description)
      end
    end

    context 'when image is missing' do
      it 'returns validation error' do
        data = valid_product_data.dup
        data.delete(:image)

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:image)
      end
    end

    context 'when multiple fields are missing' do
      it 'returns all missing fields' do
        data = { name: 'Test' }

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:details][:missing]).to include(:price, :category, :description, :image)
      end
    end

    context 'when original_price is less than price' do
      it 'returns validation error' do
        data = valid_product_data.merge(
          price: 100,
          original_price: 50
        )

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to eq('Original price must be greater than price')
      end
    end

    context 'when original_price equals price' do
      it 'returns validation error' do
        data = valid_product_data.merge(
          price: 100,
          original_price: 100
        )

        result = use_case.call(data)

        expect(result).to be_failure
        expect(result.failure[:message]).to eq('Original price must be greater than price')
      end
    end

    context 'when original_price is greater than price' do
      it 'creates product successfully' do
        data = valid_product_data.merge(
          price: 100,
          original_price: 150
        )

        allow(product_repository).to receive(:create)
          .with(data)
          .and_return(created_product)

        result = use_case.call(data)

        expect(result).to be_success
      end
    end

    context 'when repository raises an error' do
      it 'returns server error' do
        allow(product_repository).to receive(:create)
          .and_raise(StandardError.new('Database error'))

        result = use_case.call(valid_product_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
