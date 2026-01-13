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
        expect(result.value!['name']).to eq('New Product')
        expect(result.value!['price']).to eq(10000)
      end

      it 'returns product with id' do
        result = use_case.call(valid_product_data)

        expect(result.value!['id']).not_to be_nil
        expect(result.value!['id']).to be_a(Integer)
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

    context 'with price edge cases' do
      it 'handles very small prices' do
        data = valid_product_data.merge(price: 1)

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['price']).to eq(1)
      end

      it 'handles decimal prices' do
        data = valid_product_data.merge(price: 99.99)

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['price']).to eq(99.99)
      end

      it 'handles very large prices' do
        data = valid_product_data.merge(price: 999999999.99)

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['price']).to eq(999999999.99)
      end

      it 'handles prices with many decimal places' do
        data = valid_product_data.merge(price: 99.999999)

        result = use_case.call(data)

        expect(result).to be_success
        # Should round to 2 decimal places
        expect(result.value!['price']).to be_within(0.01).of(100.00)
      end

      it 'handles original_price with floating point precision' do
        data = valid_product_data.merge(price: 100.00, original_price: 100.01)

        result = use_case.call(data)

        expect(result).to be_success
      end

      it 'handles original_price rounding edge case' do
        data = valid_product_data.merge(price: 99.99, original_price: 100.005)

        result = use_case.call(data)

        expect(result).to be_success
      end

      it 'accepts original_price slightly higher than price' do
        data = valid_product_data.merge(price: 100.00, original_price: 100.01)

        result = use_case.call(data)

        expect(result).to be_success
      end
    end

    context 'with unicode and special characters' do
      it 'handles unicode in name' do
        data = valid_product_data.merge(name: 'Product™ 你好')

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['name']).to eq('Product™ 你好')
      end

      it 'handles unicode in description' do
        data = valid_product_data.merge(description: 'Description with émojis 🎉')

        result = use_case.call(data)

        expect(result).to be_success
      end

      it 'handles special SQL characters in name' do
        data = valid_product_data.merge(name: "O'Reilly's Product")

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['name']).to eq("O'Reilly's Product")
      end

      it 'handles very long strings' do
        long_name = 'A' * 500
        data = valid_product_data.merge(name: long_name)

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['name']).to eq(long_name)
      end
    end

    context 'with optional fields' do
      it 'succeeds without rating' do
        result = use_case.call(valid_product_data)

        expect(result).to be_success
        expect(result.value!['rating']).to eq(0.0)
      end

      it 'succeeds without reviews' do
        result = use_case.call(valid_product_data)

        expect(result).to be_success
        expect(result.value!['reviews']).to eq(0)
      end

      it 'succeeds without badge_text' do
        result = use_case.call(valid_product_data)

        expect(result).to be_success
        expect(result.value!).not_to have_key('badge_text')
      end

      it 'includes rating when provided' do
        data = valid_product_data.merge(rating: 4.5)

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['rating']).to eq(4.5)
      end

      it 'includes reviews when provided' do
        data = valid_product_data.merge(reviews: 100)

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['reviews']).to eq(100)
      end

      it 'includes badge when provided' do
        data = valid_product_data.merge(badge_text: 'Sale', badge_variant: 'success')

        result = use_case.call(data)

        expect(result).to be_success
        expect(result.value!['badge']).to be_a(Hash)
        expect(result.value!['badge']['text']).to eq('Sale')
        expect(result.value!['badge']['variant']).to eq('success')
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
