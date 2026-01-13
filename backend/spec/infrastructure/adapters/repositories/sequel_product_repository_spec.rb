# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Infrastructure::Adapters::Repositories::SequelProductRepository do
  let(:repository) { described_class.new(db) }

  describe '#find_all' do
    before do
      create_test_product(name: 'Product 1', price: 10000, category: 'electronics')
      create_test_product(name: 'Product 2', price: 20000, category: 'clothing')
      create_test_product(name: 'Product 3', price: 30000, category: 'electronics')
    end

    context 'without filters' do
      it 'returns all products' do
        products = repository.find_all

        expect(products.length).to eq(3)
      end

      it 'returns Product entities' do
        products = repository.find_all

        expect(products.first).to be_a(Domain::Entities::Product)
      end

      it 'includes all product attributes' do
        product = repository.find_all.first

        expect(product.id).not_to be_nil
        expect(product.name).not_to be_nil
        expect(product.price).not_to be_nil
        expect(product.category).not_to be_nil
      end
    end

    context 'with category filter' do
      it 'filters products by category' do
        products = repository.find_all(filters: { category: 'electronics' })

        expect(products.length).to eq(2)
        expect(products.all? { |p| p.category == 'electronics' }).to be true
      end
    end

    context 'with price filters' do
      it 'filters by max_price' do
        products = repository.find_all(filters: { max_price: 15000 })

        expect(products.length).to eq(1)
        expect(products.first.price).to eq(10000)
      end

      it 'filters by min_price' do
        products = repository.find_all(filters: { min_price: 25000 })

        expect(products.length).to eq(1)
        expect(products.first.price).to eq(30000)
      end

      it 'filters by price range' do
        products = repository.find_all(filters: { min_price: 15000, max_price: 25000 })

        expect(products.length).to eq(1)
        expect(products.first.price).to eq(20000)
      end
    end

    context 'with sort_by filter' do
      it 'sorts by specified field' do
        products = repository.find_all(filters: { sort_by: :price })

        prices = products.map(&:price)
        expect(prices).to eq([10000, 20000, 30000])
      end

      it 'sorts by name' do
        products = repository.find_all(filters: { sort_by: :name })

        names = products.map(&:name)
        expect(names).to eq(names.sort)
      end

      it 'defaults to id when sort_by is nil' do
        products = repository.find_all(filters: { sort_by: nil })

        expect(products.length).to eq(3)
      end

      it 'sorts by id when sort_by is :id' do
        products = repository.find_all(filters: { sort_by: :id })

        ids = products.map(&:id)
        expect(ids).to eq(ids.sort)
      end

      it 'sorts by category' do
        products = repository.find_all(filters: { sort_by: :category })

        categories = products.map(&:category)
        expect(categories).to eq(categories.sort)
      end
    end

    context 'with limit and offset' do
      it 'applies limit correctly' do
        products = repository.find_all(filters: { limit: 2 })

        expect(products.length).to eq(2)
      end

      it 'applies offset correctly' do
        products = repository.find_all(filters: { offset: 1 })

        expect(products.length).to eq(2)
      end

      it 'combines limit and offset' do
        products = repository.find_all(filters: { limit: 1, offset: 1 })

        expect(products.length).to eq(1)
      end

      it 'handles offset greater than total records' do
        products = repository.find_all(filters: { offset: 100 })

        expect(products).to be_empty
      end

      it 'rejects limit of 0' do
        expect {
          repository.find_all(filters: { limit: 0 })
        }.to raise_error(Sequel::Error, /Limits must be greater than or equal to 1/)
      end
    end

    context 'with combined filters' do
      it 'combines category, price, sort, limit and offset' do
        products = repository.find_all(filters: {
          category: 'electronics',
          min_price: 5000,
          max_price: 35000,
          sort_by: :price,
          limit: 1,
          offset: 0
        })

        expect(products.length).to eq(1)
        expect(products.first.category).to eq('electronics')
      end
    end

    context 'when no products exist' do
      before do
        db[:products].delete
      end

      it 'returns empty array' do
        products = repository.find_all

        expect(products).to eq([])
      end
    end
  end

  describe '#find_by_id' do
    let(:product_id) { create_test_product(name: 'Test Product', price: 10000) }

    context 'when product exists' do
      it 'returns the product' do
        product = repository.find_by_id(product_id)

        expect(product).not_to be_nil
        expect(product.id).to eq(product_id)
        expect(product.name).to eq('Test Product')
      end

      it 'returns a Product entity' do
        product = repository.find_by_id(product_id)

        expect(product).to be_a(Domain::Entities::Product)
      end

      it 'includes all attributes' do
        product = repository.find_by_id(product_id)

        expect(product.price).to eq(10000)
        expect(product.created_at).not_to be_nil
        expect(product.updated_at).not_to be_nil
      end
    end

    context 'when product does not exist' do
      it 'returns nil' do
        product = repository.find_by_id(99999)

        expect(product).to be_nil
      end
    end
  end

  describe '#find_by_category' do
    before do
      create_test_product(name: 'Laptop', category: 'electronics')
      create_test_product(name: 'Mouse', category: 'electronics')
      create_test_product(name: 'T-Shirt', category: 'clothing')
    end

    it 'returns products in specified category' do
      products = repository.find_by_category('electronics')

      expect(products.length).to eq(2)
      expect(products.all? { |p| p.category == 'electronics' }).to be true
    end

    it 'returns Product entities' do
      products = repository.find_by_category('electronics')

      expect(products.first).to be_a(Domain::Entities::Product)
    end

    context 'when category has no products' do
      it 'returns empty array' do
        products = repository.find_by_category('nonexistent')

        expect(products).to eq([])
      end
    end
  end

  describe '#search' do
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
        name: 'T-Shirt',
        description: 'Cotton shirt',
        category: 'clothing'
      )
    end

    it 'searches by name' do
      products = repository.search('Laptop')

      expect(products.length).to eq(1)
      expect(products.first.name).to eq('Laptop Dell')
    end

    it 'searches by description' do
      products = repository.search('wireless')

      expect(products.length).to eq(1)
      expect(products.first.name).to eq('Mouse Logitech')
    end

    it 'searches by category' do
      products = repository.search('electronics')

      expect(products.length).to eq(2)
    end

    it 'is case insensitive' do
      products = repository.search('LAPTOP')

      expect(products.length).to eq(1)
    end

    it 'performs partial matching' do
      products = repository.search('lap')

      expect(products.length).to eq(1)
    end

    context 'when no matches found' do
      it 'returns empty array' do
        products = repository.search('nonexistent')

        expect(products).to eq([])
      end
    end
  end

  describe '#create' do
    let(:product_data) do
      {
        name: 'New Product',
        price: 10000,
        original_price: 15000,
        rating: 4.5,
        reviews: 100,
        category: 'electronics',
        description: 'Product description',
        image: 'https://example.com/image.jpg',
        badge_text: 'New',
        badge_variant: 'primary'
      }
    end

    it 'creates a new product' do
      expect {
        repository.create(product_data)
      }.to change { db[:products].count }.by(1)
    end

    it 'returns the created product' do
      product = repository.create(product_data)

      expect(product).to be_a(Domain::Entities::Product)
      expect(product.id).not_to be_nil
      expect(product.name).to eq('New Product')
      expect(product.price).to eq(10000)
    end

    it 'sets default values for optional fields' do
      minimal_data = {
        name: 'Minimal Product',
        price: 5000,
        category: 'test',
        description: 'Test',
        image: 'test.jpg'
      }

      product = repository.create(minimal_data)

      expect(product.rating).to eq(0.0)
      expect(product.reviews).to eq(0)
    end

    it 'sets timestamps' do
      product = repository.create(product_data)

      expect(product.created_at).not_to be_nil
      expect(product.updated_at).not_to be_nil
    end
  end

  describe '#update' do
    let(:product_id) { create_test_product(name: 'Original Name', price: 10000) }

    it 'updates product data' do
      updated_product = repository.update(product_id, { name: 'Updated Name', price: 15000 })

      expect(updated_product.name).to eq('Updated Name')
      expect(updated_product.price).to eq(15000)
    end

    it 'updates timestamp' do
      original_product = repository.find_by_id(product_id)
      sleep 0.01

      updated_product = repository.update(product_id, { name: 'Updated' })

      expect(updated_product.updated_at).to be > original_product.updated_at
    end

    it 'returns updated product entity' do
      product = repository.update(product_id, { price: 20000 })

      expect(product).to be_a(Domain::Entities::Product)
      expect(product.id).to eq(product_id)
    end

    context 'when product does not exist' do
      it 'returns nil' do
        product = repository.update(99999, { name: 'Test' })

        expect(product).to be_nil
      end
    end
  end

  describe '#delete' do
    let!(:product_id) { create_test_product }

    it 'deletes the product' do
      expect {
        repository.delete(product_id)
      }.to change { db[:products].count }.by(-1)
    end

    it 'returns true when product was deleted' do
      result = repository.delete(product_id)

      expect(result).to be true
    end

    context 'when product does not exist' do
      it 'returns false' do
        result = repository.delete(99999)

        expect(result).to be false
      end
    end
  end

  describe '#count' do
    it 'returns number of products' do
      create_test_product
      create_test_product
      create_test_product

      expect(repository.count).to eq(3)
    end

    context 'when no products exist' do
      it 'returns zero' do
        expect(repository.count).to eq(0)
      end
    end
  end
end
