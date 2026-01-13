# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Products Controller' do
  describe 'GET /api/products' do
    before do
      create_test_product(name: 'Product 1', price: 10000, stock: 5, category: 'electronics')
      create_test_product(name: 'Product 2', price: 20000, stock: 10, category: 'clothing')
      create_test_product(name: 'Laptop', price: 150000, stock: 3, category: 'electronics')
    end

    context 'without filters' do
      it 'returns all products' do
        get '/api/products'

        expect(last_response.status).to eq(200)
        expect(json_response[:products].length).to eq(3)
      end

      it 'includes product details' do
        get '/api/products'

        product = json_response[:products].first
        expect(product).to have_key(:id)
        expect(product).to have_key(:name)
        expect(product).to have_key(:price)
        expect(product).to have_key(:stock)
        expect(product).to have_key(:category)
      end
    end

    context 'with search query' do
      it 'filters products by name' do
        get '/api/products?q=Laptop'

        expect(last_response.status).to eq(200)
        expect(json_response[:products].length).to eq(1)
        expect(json_response[:products].first[:name]).to eq('Laptop')
      end

      it 'is case insensitive' do
        get '/api/products?q=laptop'

        expect(last_response.status).to eq(200)
        expect(json_response[:products].length).to eq(1)
      end

      it 'returns empty array when no matches' do
        get '/api/products?q=nonexistent'

        expect(last_response.status).to eq(200)
        expect(json_response[:products]).to be_empty
      end
    end

    context 'with category filter' do
      it 'filters products by category' do
        get '/api/products?category=electronics'

        expect(last_response.status).to eq(200)
        expect(json_response[:products].length).to eq(2)
        expect(json_response[:products].all? { |p| p[:category] == 'electronics' }).to be true
      end
    end

    context 'with pagination' do
      it 'limits results with limit parameter' do
        get '/api/products?limit=2'

        expect(last_response.status).to eq(200)
        expect(json_response[:products].length).to eq(2)
      end

      it 'offsets results with offset parameter' do
        get '/api/products?offset=1'

        expect(last_response.status).to eq(200)
        expect(json_response[:products].length).to eq(2)
      end
    end

    context 'with sorting' do
      it 'sorts by price ascending' do
        get '/api/products?sort_by=price'

        expect(last_response.status).to eq(200)
        prices = json_response[:products].map { |p| p[:price] }
        expect(prices).to eq(prices.sort)
      end
    end
  end

  describe 'GET /api/products/:id' do
    let!(:product_id) { create_test_product(name: 'Test Product', price: 10000) }

    context 'when product exists' do
      it 'returns product details' do
        get "/api/products/#{product_id}"

        expect(last_response.status).to eq(200)
        expect(json_response[:id]).to eq(product_id)
        expect(json_response[:name]).to eq('Test Product')
        expect(json_response[:price]).to eq(10000)
      end
    end

    context 'when product does not exist' do
      it 'returns 404' do
        get '/api/products/99999'

        expect(last_response.status).to eq(404)
        expect(json_response[:error]).to include('not found')
      end
    end

    context 'with invalid id' do
      it 'returns 400 for validation error' do
        get '/api/products/invalid'

        expect(last_response.status).to eq(400)
        expect(json_response[:error]).to include('Invalid')
      end
    end
  end

end
