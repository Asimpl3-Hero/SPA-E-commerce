require 'spec_helper'

RSpec.describe Domain::Entities::Product do
  describe '#initialize' do
    it 'creates a product with required attributes' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.id).to eq(1)
      expect(product.name).to eq('Test Product')
      expect(product.price).to eq(100.0)
      expect(product.category).to eq('Electronics')
      expect(product.description).to eq('A test product')
      expect(product.image).to eq('test.jpg')
    end

    it 'sets default values for optional attributes' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.original_price).to be_nil
      expect(product.rating).to eq(0.0)
      expect(product.reviews).to eq(0)
      expect(product.badge_text).to be_nil
      expect(product.badge_variant).to be_nil
      expect(product.stock).to eq(0)
    end

    it 'accepts optional attributes' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        original_price: 150.0,
        rating: 4.5,
        reviews: 10,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        badge_text: 'New',
        badge_variant: 'primary',
        stock: 50
      )

      expect(product.original_price).to eq(150.0)
      expect(product.rating).to eq(4.5)
      expect(product.reviews).to eq(10)
      expect(product.badge_text).to eq('New')
      expect(product.badge_variant).to eq('primary')
      expect(product.stock).to eq(50)
    end
  end

  describe '#to_h' do
    it 'converts product to hash with camelCase keys' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        original_price: 150.0,
        rating: 4.5,
        reviews: 10,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        stock: 50
      )

      hash = product.to_h

      expect(hash['id']).to eq(1)
      expect(hash['name']).to eq('Test Product')
      expect(hash['price']).to eq(100.0)
      expect(hash['originalPrice']).to eq(150.0)
      expect(hash['rating']).to eq(4.5)
      expect(hash['reviews']).to eq(10)
      expect(hash['category']).to eq('Electronics')
      expect(hash['description']).to eq('A test product')
      expect(hash['image']).to eq('test.jpg')
      expect(hash['stock']).to eq(50)
    end

    it 'includes badge when both text and variant are present' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        badge_text: 'New',
        badge_variant: 'primary'
      )

      hash = product.to_h
      expect(hash['badge']).to eq({ 'text' => 'New', 'variant' => 'primary' })
    end

    it 'excludes badge when text or variant is missing' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        badge_text: 'New'
      )

      hash = product.to_h
      expect(hash['badge']).to be_nil
    end

    it 'excludes nil values' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      hash = product.to_h
      expect(hash.key?('originalPrice')).to be(false)
    end
  end

  describe '#in_stock?' do
    it 'returns true when stock is greater than 0' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        stock: 10
      )

      expect(product.in_stock?).to be(true)
    end

    it 'returns false when stock is 0' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        stock: 0
      )

      expect(product.in_stock?).to be(false)
    end
  end

  describe '#low_stock?' do
    it 'returns true when stock is between 1 and 10' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        stock: 5
      )

      expect(product.low_stock?).to be(true)
    end

    it 'returns false when stock is 0' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        stock: 0
      )

      expect(product.low_stock?).to be(false)
    end

    it 'returns false when stock is greater than 10' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg',
        stock: 20
      )

      expect(product.low_stock?).to be(false)
    end
  end

  describe '#has_discount?' do
    it 'returns true when original price is greater than price' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        original_price: 150.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.has_discount?).to be(true)
    end

    it 'returns false when original price is nil' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.has_discount?).to be(false)
    end

    it 'returns false when original price equals price' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        original_price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.has_discount?).to be(false)
    end
  end

  describe '#discount_percentage' do
    it 'calculates discount percentage correctly' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 75.0,
        original_price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.discount_percentage).to eq(25)
    end

    it 'returns 0 when there is no discount' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.discount_percentage).to eq(0)
    end

    it 'rounds discount percentage' do
      product = described_class.new(
        id: 1,
        name: 'Test Product',
        price: 66.67,
        original_price: 100.0,
        category: 'Electronics',
        description: 'A test product',
        image: 'test.jpg'
      )

      expect(product.discount_percentage).to eq(33)
    end
  end
end
