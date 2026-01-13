require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/repositories/sequel_product_repository'
require_relative '../../../../config/database'

RSpec.describe Infrastructure::Adapters::Repositories::SequelProductRepository, db: true do
  let(:db) { Sequel.sqlite }
  let(:repository) { described_class.new(db) }

  before do
    # Create products table
    db.create_table :products do
      primary_key :id
      String :name, null: false
      Float :price, null: false
      Float :original_price
      Float :rating, default: 0.0
      Integer :reviews, default: 0
      String :category
      String :description
      String :image
      String :badge_text
      String :badge_variant
      Integer :stock, default: 0
      Time :created_at
      Time :updated_at
    end
  end

  after do
    db.drop_table?(:products)
  end

  describe '#find_all' do
    context 'when products exist' do
      before do
        db[:products].insert(
          name: 'Product 1',
          price: 100.0,
          category: 'Electronics',
          description: 'Test product 1',
          image: 'image1.jpg',
          stock: 10,
          created_at: Time.now,
          updated_at: Time.now
        )
        db[:products].insert(
          name: 'Product 2',
          price: 200.0,
          category: 'Clothing',
          description: 'Test product 2',
          image: 'image2.jpg',
          stock: 5,
          created_at: Time.now,
          updated_at: Time.now
        )
      end

      it 'returns all products' do
        products = repository.find_all
        expect(products.size).to eq(2)
        expect(products.first).to be_a(Domain::Entities::Product)
        expect(products.first.name).to eq('Product 1')
      end

      it 'filters by category' do
        products = repository.find_all(filters: { category: 'Electronics' })
        expect(products.size).to eq(1)
        expect(products.first.category).to eq('Electronics')
      end

      it 'filters by max_price' do
        products = repository.find_all(filters: { max_price: 150.0 })
        expect(products.size).to eq(1)
        expect(products.first.price).to eq(100.0)
      end

      it 'filters by min_price' do
        products = repository.find_all(filters: { min_price: 150.0 })
        expect(products.size).to eq(1)
        expect(products.first.price).to eq(200.0)
      end

      it 'limits results' do
        products = repository.find_all(filters: { limit: 1 })
        expect(products.size).to eq(1)
      end

      it 'applies offset' do
        products = repository.find_all(filters: { offset: 1 })
        expect(products.size).to eq(1)
        expect(products.first.name).to eq('Product 2')
      end

      it 'sorts by field' do
        products = repository.find_all(filters: { sort_by: :price })
        expect(products.first.price).to eq(100.0)
        expect(products.last.price).to eq(200.0)
      end
    end

    context 'when no products exist' do
      it 'returns empty array' do
        products = repository.find_all
        expect(products).to eq([])
      end
    end
  end

  describe '#find_by_id' do
    let!(:product_id) do
      db[:products].insert(
        name: 'Test Product',
        price: 100.0,
        category: 'Electronics',
        description: 'Test description',
        image: 'test.jpg',
        stock: 10,
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    context 'when product exists' do
      it 'returns the product' do
        product = repository.find_by_id(product_id)
        expect(product).to be_a(Domain::Entities::Product)
        expect(product.id).to eq(product_id)
        expect(product.name).to eq('Test Product')
      end
    end

    context 'when product does not exist' do
      it 'returns nil' do
        product = repository.find_by_id(999)
        expect(product).to be_nil
      end
    end
  end

  describe '#find_by_category' do
    before do
      db[:products].insert(
        name: 'Electronics Product',
        price: 100.0,
        category: 'Electronics',
        description: 'Test',
        image: 'test.jpg',
        created_at: Time.now,
        updated_at: Time.now
      )
      db[:products].insert(
        name: 'Clothing Product',
        price: 50.0,
        category: 'Clothing',
        description: 'Test',
        image: 'test.jpg',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'returns products in category' do
      products = repository.find_by_category('Electronics')
      expect(products.size).to eq(1)
      expect(products.first.category).to eq('Electronics')
    end

    it 'returns empty array when no products in category' do
      products = repository.find_by_category('Books')
      expect(products).to eq([])
    end
  end

  describe '#search' do
    before do
      db[:products].insert(
        name: 'Laptop Computer',
        price: 1000.0,
        category: 'Electronics',
        description: 'High performance laptop',
        image: 'laptop.jpg',
        created_at: Time.now,
        updated_at: Time.now
      )
      db[:products].insert(
        name: 'Wireless Mouse',
        price: 25.0,
        category: 'Electronics',
        description: 'Bluetooth mouse',
        image: 'mouse.jpg',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'searches by name' do
      products = repository.search('laptop')
      expect(products.size).to eq(1)
      expect(products.first.name).to include('Laptop')
    end

    it 'searches by description' do
      products = repository.search('bluetooth')
      expect(products.size).to eq(1)
      expect(products.first.name).to eq('Wireless Mouse')
    end

    it 'searches by category' do
      products = repository.search('electronics')
      expect(products.size).to eq(2)
    end

    it 'is case insensitive' do
      products = repository.search('LAPTOP')
      expect(products.size).to eq(1)
    end

    it 'returns empty array when no matches' do
      products = repository.search('nonexistent')
      expect(products).to eq([])
    end
  end

  describe '#create' do
    let(:product_data) do
      {
        name: 'New Product',
        price: 150.0,
        original_price: 200.0,
        rating: 4.5,
        reviews: 10,
        category: 'Electronics',
        description: 'A new product',
        image: 'new.jpg',
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
      expect(product.price).to eq(150.0)
      expect(product.original_price).to eq(200.0)
      expect(product.rating).to eq(4.5)
      expect(product.reviews).to eq(10)
    end

    it 'sets timestamps' do
      product = repository.create(product_data)
      expect(product.created_at).not_to be_nil
      expect(product.updated_at).not_to be_nil
    end
  end

  describe '#update' do
    let!(:product_id) do
      db[:products].insert(
        name: 'Original Name',
        price: 100.0,
        category: 'Electronics',
        description: 'Original description',
        image: 'original.jpg',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'updates product fields' do
      updated = repository.update(product_id, { name: 'Updated Name', price: 150.0 })
      expect(updated.name).to eq('Updated Name')
      expect(updated.price).to eq(150.0)
    end

    it 'updates timestamp' do
      original_time = db[:products].where(id: product_id).get(:updated_at)
      sleep(0.1)
      repository.update(product_id, { name: 'Updated' })
      new_time = db[:products].where(id: product_id).get(:updated_at)
      expect(new_time).to be > original_time
    end

    it 'returns the updated product' do
      product = repository.update(product_id, { name: 'Updated' })
      expect(product).to be_a(Domain::Entities::Product)
      expect(product.id).to eq(product_id)
    end
  end

  describe '#delete' do
    let!(:product_id) do
      db[:products].insert(
        name: 'To Delete',
        price: 100.0,
        category: 'Electronics',
        description: 'Will be deleted',
        image: 'delete.jpg',
        created_at: Time.now,
        updated_at: Time.now
      )
    end

    it 'deletes the product' do
      expect {
        repository.delete(product_id)
      }.to change { db[:products].count }.by(-1)
    end

    it 'returns true when product deleted' do
      result = repository.delete(product_id)
      expect(result).to be(true)
    end

    it 'returns false when product does not exist' do
      result = repository.delete(999)
      expect(result).to be(false)
    end
  end

  describe '#count' do
    it 'returns 0 when no products' do
      expect(repository.count).to eq(0)
    end

    it 'returns correct count' do
      3.times do |i|
        db[:products].insert(
          name: "Product #{i}",
          price: 100.0,
          category: 'Electronics',
          description: 'Test',
          image: 'test.jpg',
          created_at: Time.now,
          updated_at: Time.now
        )
      end
      expect(repository.count).to eq(3)
    end
  end
end
