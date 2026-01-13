# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Domain::Entities::Product do
  let(:required_attributes) do
    {
      id: 1,
      name: 'Test Product',
      price: 10000,
      category: 'electronics',
      description: 'A great product',
      image: 'https://example.com/image.jpg'
    }
  end

  describe '#initialize' do
    context 'with required attributes only' do
      let(:product) { described_class.new(**required_attributes) }

      it 'creates a product' do
        expect(product).to be_a(Domain::Entities::Product)
      end

      it 'sets required attributes' do
        expect(product.id).to eq(1)
        expect(product.name).to eq('Test Product')
        expect(product.price).to eq(10000)
        expect(product.category).to eq('electronics')
        expect(product.description).to eq('A great product')
        expect(product.image).to eq('https://example.com/image.jpg')
      end

      it 'sets default values for optional attributes' do
        expect(product.original_price).to be_nil
        expect(product.rating).to eq(0.0)
        expect(product.reviews).to eq(0)
        expect(product.badge_text).to be_nil
        expect(product.badge_variant).to be_nil
      end
    end

    context 'with all attributes' do
      let(:all_attributes) do
        required_attributes.merge(
          original_price: 15000,
          rating: 4.5,
          reviews: 100,
          badge_text: 'New',
          badge_variant: 'primary',
          created_at: Time.now,
          updated_at: Time.now
        )
      end

      let(:product) { described_class.new(**all_attributes) }

      it 'sets all attributes' do
        expect(product.original_price).to eq(15000)
        expect(product.rating).to eq(4.5)
        expect(product.reviews).to eq(100)
        expect(product.badge_text).to eq('New')
        expect(product.badge_variant).to eq('primary')
        expect(product.created_at).not_to be_nil
        expect(product.updated_at).not_to be_nil
      end
    end
  end

  describe '#to_h' do
    context 'without optional fields' do
      let(:product) { described_class.new(**required_attributes) }
      let(:hash) { product.to_h }

      it 'returns a hash with required fields' do
        expect(hash).to be_a(Hash)
        expect(hash['id']).to eq(1)
        expect(hash['name']).to eq('Test Product')
        expect(hash['price']).to eq(10000)
        expect(hash['category']).to eq('electronics')
        expect(hash['description']).to eq('A great product')
        expect(hash['image']).to eq('https://example.com/image.jpg')
      end

      it 'excludes nil optional fields' do
        expect(hash).not_to have_key('originalPrice')
        expect(hash).not_to have_key('badge')
      end

      it 'compacts nil values' do
        expect(hash.values).not_to include(nil)
      end
    end

    context 'with badge' do
      let(:product) do
        described_class.new(
          **required_attributes.merge(
            badge_text: 'Sale',
            badge_variant: 'danger'
          )
        )
      end

      it 'includes badge object' do
        hash = product.to_h

        expect(hash['badge']).to be_a(Hash)
        expect(hash['badge']['text']).to eq('Sale')
        expect(hash['badge']['variant']).to eq('danger')
      end
    end

    context 'with partial badge' do
      it 'excludes badge when only text is present' do
        product = described_class.new(**required_attributes.merge(badge_text: 'New'))
        hash = product.to_h

        expect(hash).not_to have_key('badge')
      end

      it 'excludes badge when only variant is present' do
        product = described_class.new(**required_attributes.merge(badge_variant: 'primary'))
        hash = product.to_h

        expect(hash).not_to have_key('badge')
      end
    end

    context 'with original_price' do
      let(:product) do
        described_class.new(**required_attributes.merge(original_price: 15000))
      end

      it 'includes originalPrice' do
        hash = product.to_h

        expect(hash['originalPrice']).to eq(15000)
      end
    end
  end

  describe '#has_discount?' do
    context 'when original_price is greater than price' do
      let(:product) do
        described_class.new(**required_attributes.merge(
          price: 10000,
          original_price: 15000
        ))
      end

      it 'returns true' do
        expect(product.has_discount?).to be true
      end
    end

    context 'when original_price is nil' do
      let(:product) { described_class.new(**required_attributes) }

      it 'returns false' do
        expect(product.has_discount?).to be false
      end
    end

    context 'when original_price equals price' do
      let(:product) do
        described_class.new(**required_attributes.merge(
          price: 10000,
          original_price: 10000
        ))
      end

      it 'returns false' do
        expect(product.has_discount?).to be false
      end
    end

    context 'when original_price is less than price' do
      let(:product) do
        described_class.new(**required_attributes.merge(
          price: 10000,
          original_price: 8000
        ))
      end

      it 'returns false' do
        expect(product.has_discount?).to be false
      end
    end
  end

  describe '#in_stock?' do
    context 'when stock is greater than 0' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 5)) }

      it 'returns true' do
        expect(product.in_stock?).to be true
      end
    end

    context 'when stock is 0' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 0)) }

      it 'returns false' do
        expect(product.in_stock?).to be false
      end
    end

    context 'when stock is 1' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 1)) }

      it 'returns true' do
        expect(product.in_stock?).to be true
      end
    end
  end

  describe '#low_stock?' do
    context 'when stock is between 1 and 10' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 5)) }

      it 'returns true' do
        expect(product.low_stock?).to be true
      end
    end

    context 'when stock is exactly 10' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 10)) }

      it 'returns true' do
        expect(product.low_stock?).to be true
      end
    end

    context 'when stock is exactly 11' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 11)) }

      it 'returns false' do
        expect(product.low_stock?).to be false
      end
    end

    context 'when stock is 0' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 0)) }

      it 'returns false' do
        expect(product.low_stock?).to be false
      end
    end

    context 'when stock is exactly 1' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 1)) }

      it 'returns true' do
        expect(product.low_stock?).to be true
      end
    end

    context 'when stock is very high' do
      let(:product) { described_class.new(**required_attributes.merge(stock: 100)) }

      it 'returns false' do
        expect(product.low_stock?).to be false
      end
    end
  end

  describe '#discount_percentage' do
    context 'when product has discount' do
      let(:product) do
        described_class.new(**required_attributes.merge(
          price: 8000,
          original_price: 10000
        ))
      end

      it 'calculates discount percentage' do
        expect(product.discount_percentage).to eq(20)
      end

      it 'rounds to nearest integer' do
        product = described_class.new(**required_attributes.merge(
          price: 6666,
          original_price: 10000
        ))

        expect(product.discount_percentage).to eq(33)
      end
    end

    context 'when product has no discount' do
      let(:product) { described_class.new(**required_attributes) }

      it 'returns 0' do
        expect(product.discount_percentage).to eq(0)
      end
    end

    context 'with various discount scenarios' do
      it 'calculates 50% discount correctly' do
        product = described_class.new(**required_attributes.merge(
          price: 5000,
          original_price: 10000
        ))

        expect(product.discount_percentage).to eq(50)
      end

      it 'calculates 10% discount correctly' do
        product = described_class.new(**required_attributes.merge(
          price: 9000,
          original_price: 10000
        ))

        expect(product.discount_percentage).to eq(10)
      end

      it 'calculates 75% discount correctly' do
        product = described_class.new(**required_attributes.merge(
          price: 2500,
          original_price: 10000
        ))

        expect(product.discount_percentage).to eq(75)
      end
    end
  end

  describe 'attr_readers' do
    let(:product) { described_class.new(**required_attributes) }

    it 'provides read access to all attributes' do
      expect(product).to respond_to(:id)
      expect(product).to respond_to(:name)
      expect(product).to respond_to(:price)
      expect(product).to respond_to(:original_price)
      expect(product).to respond_to(:rating)
      expect(product).to respond_to(:reviews)
      expect(product).to respond_to(:category)
      expect(product).to respond_to(:description)
      expect(product).to respond_to(:image)
      expect(product).to respond_to(:badge_text)
      expect(product).to respond_to(:badge_variant)
      expect(product).to respond_to(:created_at)
      expect(product).to respond_to(:updated_at)
    end

    it 'does not provide write access' do
      expect(product).not_to respond_to(:name=)
      expect(product).not_to respond_to(:price=)
    end
  end
end
