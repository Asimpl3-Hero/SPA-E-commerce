# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Infrastructure::Adapters::Web::CategoriesController do
  let(:get_all_categories) { double('GetAllCategories') }

  def app
    Infrastructure::Adapters::Web::CategoriesController.new(
      nil,
      use_cases: { get_all_categories: get_all_categories }
    )
  end

  describe 'GET /api/categories' do
    context 'when categories are found' do
      let(:categories) do
        [
          {
            'id' => 1,
            'name' => 'Electronics',
            'slug' => 'electronics'
          },
          {
            'id' => 2,
            'name' => 'Clothing',
            'slug' => 'clothing'
          },
          {
            'id' => 3,
            'name' => 'Books',
            'slug' => 'books'
          }
        ]
      end

      before do
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.success(categories))
        get '/api/categories'
      end

      it 'returns status 200' do
        expect(last_response.status).to eq(200)
      end

      it 'returns JSON content type' do
        expect(last_response.content_type).to include('application/json')
      end

      it 'returns array of categories' do
        body = Oj.load(last_response.body)
        expect(body).to be_an(Array)
      end

      it 'returns all categories' do
        body = Oj.load(last_response.body)
        expect(body.length).to eq(3)
      end

      it 'includes category id' do
        body = Oj.load(last_response.body)
        expect(body.first['id']).to eq(1)
      end

      it 'includes category name' do
        body = Oj.load(last_response.body)
        expect(body.first['name']).to eq('Electronics')
      end

      it 'includes category slug' do
        body = Oj.load(last_response.body)
        expect(body.first['slug']).to eq('electronics')
      end

      it 'calls use case' do
        expect(get_all_categories).to have_received(:call)
      end

      it 'returns valid JSON' do
        expect { Oj.load(last_response.body) }.not_to raise_error
      end
    end

    context 'when no categories exist' do
      before do
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.success([]))
        get '/api/categories'
      end

      it 'returns status 200' do
        expect(last_response.status).to eq(200)
      end

      it 'returns empty array' do
        body = Oj.load(last_response.body)
        expect(body).to eq([])
      end
    end

    context 'when use case fails' do
      let(:error) do
        {
          type: :server_error,
          message: 'Database connection failed'
        }
      end

      before do
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.failure(error))
        get '/api/categories'
      end

      it 'returns status 500' do
        expect(last_response.status).to eq(500)
      end

      it 'returns JSON content type' do
        expect(last_response.content_type).to include('application/json')
      end

      it 'returns error message' do
        body = Oj.load(last_response.body, symbol_keys: true)
        expect(body[:error]).to eq('Database connection failed')
      end

      it 'includes error key in response' do
        body = Oj.load(last_response.body, symbol_keys: true)
        expect(body).to have_key(:error)
      end
    end

    context 'with different error types' do
      it 'handles validation errors' do
        error = { type: :validation_error, message: 'Invalid request' }
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.failure(error))

        get '/api/categories'

        expect(last_response.status).to eq(500)
        body = Oj.load(last_response.body, symbol_keys: true)
        expect(body[:error]).to eq('Invalid request')
      end

      it 'handles not found errors' do
        error = { type: :not_found, message: 'Categories not found' }
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.failure(error))

        get '/api/categories'

        expect(last_response.status).to eq(500)
        body = Oj.load(last_response.body, symbol_keys: true)
        expect(body[:error]).to eq('Categories not found')
      end
    end

    context 'with single category' do
      let(:single_category) do
        [{
          'id' => 1,
          'name' => 'Electronics',
          'slug' => 'electronics'
        }]
      end

      before do
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.success(single_category))
        get '/api/categories'
      end

      it 'returns array with one element' do
        body = Oj.load(last_response.body)
        expect(body.length).to eq(1)
      end

      it 'returns category data correctly' do
        body = Oj.load(last_response.body)
        expect(body.first['name']).to eq('Electronics')
      end
    end

    context 'with many categories' do
      let(:many_categories) do
        (1..20).map do |i|
          {
            'id' => i,
            'name' => "Category #{i}",
            'slug' => "category-#{i}"
          }
        end
      end

      before do
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.success(many_categories))
        get '/api/categories'
      end

      it 'returns all categories' do
        body = Oj.load(last_response.body)
        expect(body.length).to eq(20)
      end

      it 'maintains correct order' do
        body = Oj.load(last_response.body)
        expect(body.first['id']).to eq(1)
        expect(body.last['id']).to eq(20)
      end
    end
  end

  describe 'HTTP methods' do
    before do
      allow(get_all_categories).to receive(:call)
        .and_return(Domain::ValueObjects::Result.success([]))
    end

    it 'only accepts GET requests' do
      post '/api/categories'
      expect(last_response.status).to eq(404)
    end

    it 'does not accept PUT' do
      put '/api/categories'
      expect(last_response.status).to eq(404)
    end

    it 'does not accept DELETE' do
      delete '/api/categories'
      expect(last_response.status).to eq(404)
    end

    it 'does not accept PATCH' do
      patch '/api/categories'
      expect(last_response.status).to eq(404)
    end
  end

  describe 'response format' do
    before do
      allow(get_all_categories).to receive(:call)
        .and_return(Domain::ValueObjects::Result.success([
          { 'id' => 1, 'name' => 'Test', 'slug' => 'test' }
        ]))
      get '/api/categories'
    end

    it 'uses Oj for JSON serialization' do
      expect(last_response.body).to match(/"name":"Test"/)
    end

    it 'uses compact mode for Oj' do
      body = last_response.body
      expect(body).not_to include("\n")
    end
  end

  describe 'initialization' do
    it 'requires use_cases parameter' do
      expect {
        Infrastructure::Adapters::Web::CategoriesController.new(nil, use_cases: {})
      }.not_to raise_error
    end

    it 'stores get_all_categories use case' do
      controller = Infrastructure::Adapters::Web::CategoriesController.new(
        nil,
        use_cases: { get_all_categories: get_all_categories }
      )
      expect(controller.instance_variable_get(:@get_all_categories)).to eq(get_all_categories)
    end
  end

  describe 'error resilience' do
    it 'handles use case raising exception' do
      allow(get_all_categories).to receive(:call).and_raise(StandardError, 'Unexpected error')

      expect {
        get '/api/categories'
      }.to raise_error(StandardError)
    end
  end
end
