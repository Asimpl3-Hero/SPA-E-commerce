require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/web/health_controller'
require_relative '../../../support/test_helpers'

RSpec.describe Infrastructure::Adapters::Web::HealthController, type: :controller do
  def app
    Infrastructure::Adapters::Web::HealthController
  end

  describe 'GET /health' do
    it 'returns 200 status' do
      get '/health'
      expect(last_response.status).to eq(200)
    end

    it 'returns JSON content type' do
      get '/health'
      expect(last_response.headers['Content-Type']).to include('application/json')
    end

    it 'returns status ok' do
      get '/health'
      data = json_response
      expect(data[:status]).to eq('ok')
    end

    it 'includes timestamp' do
      get '/health'
      data = json_response
      expect(data[:timestamp]).to be_a(String)
    end
  end

  describe 'GET /' do
    it 'returns 200 status' do
      get '/'
      expect(last_response.status).to eq(200)
    end

    it 'returns API information' do
      get '/'
      data = json_response
      expect(data[:name]).to eq('E-Commerce API')
      expect(data[:version]).to eq('1.0.0')
    end

    it 'includes endpoints information' do
      get '/'
      data = json_response
      expect(data[:endpoints]).to be_a(Hash)
      expect(data[:endpoints][:health]).to eq('/health')
      expect(data[:endpoints][:products]).to eq('/api/products')
      expect(data[:endpoints][:categories]).to eq('/api/categories')
    end
  end
end
