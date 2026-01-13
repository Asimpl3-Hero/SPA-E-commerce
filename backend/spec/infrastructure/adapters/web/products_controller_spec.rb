require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/web/products_controller'
require_relative '../../../support/test_helpers'

RSpec.describe Infrastructure::Adapters::Web::ProductsController, type: :controller do
  let(:get_all_products) { double('GetAllProducts') }
  let(:get_product_by_id) { double('GetProductById') }
  let(:search_products) { double('SearchProducts') }
  let(:create_product) { double('CreateProduct') }

  let(:use_cases) do
    {
      get_all_products: get_all_products,
      get_product_by_id: get_product_by_id,
      search_products: search_products,
      create_product: create_product
    }
  end

  def app
    Infrastructure::Adapters::Web::ProductsController.new(nil, use_cases: use_cases)
  end

  describe 'GET /api/products' do
    context 'without search query' do
      it 'returns all products' do
        products_data = { products: [{ 'id' => 1, 'name' => 'Product 1' }] }
        allow(get_all_products).to receive(:call)
          .with(filters: {})
          .and_return(Domain::ValueObjects::Result.success(products_data))

        get '/api/products'

        expect(last_response.status).to eq(200)
        data = json_response
        expect(data[:products]).to be_an(Array)
        expect(data[:products].first[:id]).to eq(1)
      end
    end

    context 'with filters' do
      it 'passes filters to use case' do
        products_data = { products: [] }
        expected_filters = {
          category: 'Electronics',
          max_price: 500.0,
          min_price: 100.0
        }

        allow(get_all_products).to receive(:call)
          .with(filters: expected_filters)
          .and_return(Domain::ValueObjects::Result.success(products_data))

        get '/api/products?category=Electronics&max_price=500&min_price=100'

        expect(last_response.status).to eq(200)
      end
    end

    context 'with search query' do
      it 'uses search use case instead of get all' do
        products_data = { products: [{ 'id' => 1, 'name' => 'Laptop' }] }
        allow(search_products).to receive(:call)
          .with(query: 'laptop', category: nil)
          .and_return(Domain::ValueObjects::Result.success(products_data))

        get '/api/products?search=laptop'

        expect(last_response.status).to eq(200)
        data = json_response
        expect(data[:products].first[:name]).to eq('Laptop')
      end
    end

    context 'with q parameter' do
      it 'uses search use case' do
        products_data = { products: [{ 'id' => 1, 'name' => 'Laptop' }] }
        allow(search_products).to receive(:call)
          .with(query: 'laptop', category: nil)
          .and_return(Domain::ValueObjects::Result.success(products_data))

        get '/api/products?q=laptop'

        expect(last_response.status).to eq(200)
      end
    end

    context 'when use case fails' do
      it 'returns error response' do
        allow(get_all_products).to receive(:call)
          .and_return(Domain::ValueObjects::Result.server_error('Database error'))

        get '/api/products'

        expect(last_response.status).to eq(500)
        data = json_response
        expect(data[:error]).to eq('Database error')
      end
    end
  end

  describe 'GET /api/products/:id' do
    context 'when product exists' do
      it 'returns product data' do
        product_data = { 'id' => 1, 'name' => 'Test Product', 'price' => 100.0 }
        allow(get_product_by_id).to receive(:call)
          .with('1')
          .and_return(Domain::ValueObjects::Result.success(product_data))

        get '/api/products/1'

        expect(last_response.status).to eq(200)
        data = json_response
        expect(data[:id]).to eq(1)
        expect(data[:name]).to eq('Test Product')
      end
    end

    context 'when product not found' do
      it 'returns 404' do
        allow(get_product_by_id).to receive(:call)
          .with('999')
          .and_return(Domain::ValueObjects::Result.not_found('Product', 999))

        get '/api/products/999'

        expect(last_response.status).to eq(404)
        data = json_response
        expect(data[:error]).to include('not found')
      end
    end

    context 'when validation error' do
      it 'returns 400' do
        allow(get_product_by_id).to receive(:call)
          .with('invalid')
          .and_return(Domain::ValueObjects::Result.validation_error('Invalid ID'))

        get '/api/products/invalid'

        expect(last_response.status).to eq(400)
        data = json_response
        expect(data[:error]).to eq('Invalid ID')
      end
    end
  end

  describe 'POST /api/products' do
    let(:product_data) do
      {
        name: 'New Product',
        price: 100.0,
        category: 'Electronics',
        description: 'A new product',
        image: 'test.jpg'
      }
    end

    context 'with valid data' do
      it 'creates product and returns 201' do
        created_product = product_data.merge(id: 1)
        allow(create_product).to receive(:call)
          .with(product_data)
          .and_return(Domain::ValueObjects::Result.success(created_product))

        post '/api/products', Oj.dump(product_data), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(201)
        data = json_response
        expect(data[:id]).to eq(1)
        expect(data[:name]).to eq('New Product')
      end
    end

    context 'with invalid JSON' do
      it 'returns 400' do
        post '/api/products', 'invalid json', 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(400)
        data = json_response
        expect(data[:error]).to eq('Invalid JSON')
      end
    end

    context 'with validation error' do
      it 'returns 400 with error details' do
        allow(create_product).to receive(:call)
          .and_return(Domain::ValueObjects::Result.validation_error('Missing required fields', { missing: [:name] }))

        post '/api/products', Oj.dump(product_data), 'CONTENT_TYPE' => 'application/json'

        expect(last_response.status).to eq(400)
        data = json_response
        expect(data[:error]).to eq('Missing required fields')
        expect(data[:details][:missing]).to eq(['name'])
      end
    end
  end
end
