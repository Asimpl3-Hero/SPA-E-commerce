require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/web/categories_controller'
require_relative '../../../support/test_helpers'

RSpec.describe Infrastructure::Adapters::Web::CategoriesController, type: :controller do
  let(:get_all_categories) { double('GetAllCategories') }

  let(:use_cases) do
    {
      get_all_categories: get_all_categories
    }
  end

  def app
    Infrastructure::Adapters::Web::CategoriesController.new(nil, use_cases: use_cases)
  end

  describe 'GET /api/categories' do
    context 'when categories exist' do
      it 'returns all categories' do
        categories_data = [
          { 'id' => 1, 'name' => 'Electronics', 'slug' => 'electronics' },
          { 'id' => 2, 'name' => 'Clothing', 'slug' => 'clothing' }
        ]

        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.success(categories_data))

        get '/api/categories'

        expect(last_response.status).to eq(200)
        data = json_response
        expect(data).to be_an(Array)
        expect(data.size).to eq(2)
        expect(data.first[:name]).to eq('Electronics')
      end
    end

    context 'when no categories exist' do
      it 'returns empty array' do
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.success([]))

        get '/api/categories'

        expect(last_response.status).to eq(200)
        data = json_response
        expect(data).to eq([])
      end
    end

    context 'when use case fails' do
      it 'returns 500 with error message' do
        allow(get_all_categories).to receive(:call)
          .and_return(Domain::ValueObjects::Result.server_error('Database error'))

        get '/api/categories'

        expect(last_response.status).to eq(500)
        data = json_response
        expect(data[:error]).to eq('Database error')
      end
    end
  end
end
