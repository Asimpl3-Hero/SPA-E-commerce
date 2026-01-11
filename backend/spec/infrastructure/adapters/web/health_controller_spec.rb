# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Infrastructure::Adapters::Web::HealthController do
  def app
    Infrastructure::Adapters::Web::HealthController
  end

  describe 'GET /health' do
    before do
      get '/health'
    end

    it 'returns status 200' do
      expect(last_response.status).to eq(200)
    end

    it 'returns JSON content type' do
      expect(last_response.content_type).to include('application/json')
    end

    it 'returns ok status in body' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:status]).to eq('ok')
    end

    it 'includes timestamp in response' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:timestamp]).not_to be_nil
    end

    it 'timestamp is in ISO8601 format' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect { Time.iso8601(body[:timestamp]) }.not_to raise_error
    end

    it 'timestamp is recent' do
      body = Oj.load(last_response.body, symbol_keys: true)
      timestamp = Time.iso8601(body[:timestamp])
      expect(timestamp).to be_within(5).of(Time.now)
    end

    it 'returns valid JSON' do
      expect { Oj.load(last_response.body) }.not_to raise_error
    end
  end

  describe 'GET /' do
    before do
      get '/'
    end

    it 'returns status 200' do
      expect(last_response.status).to eq(200)
    end

    it 'returns JSON content type' do
      expect(last_response.content_type).to include('application/json')
    end

    it 'returns API name' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:name]).to eq('E-Commerce API')
    end

    it 'returns API version' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:version]).to eq('1.0.0')
    end

    it 'includes endpoints information' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:endpoints]).to be_a(Hash)
    end

    it 'lists health endpoint' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:endpoints][:health]).to eq('/health')
    end

    it 'lists products endpoint' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:endpoints][:products]).to eq('/api/products')
    end

    it 'lists categories endpoint' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:endpoints][:categories]).to eq('/api/categories')
    end

    it 'returns valid JSON' do
      expect { Oj.load(last_response.body) }.not_to raise_error
    end

    it 'includes exactly 3 endpoint entries' do
      body = Oj.load(last_response.body, symbol_keys: true)
      expect(body[:endpoints].keys.length).to eq(3)
    end
  end

  describe 'response format' do
    it 'health endpoint uses Oj for JSON serialization' do
      get '/health'
      expect(last_response.body).to match(/"status":"ok"/)
    end

    it 'root endpoint uses Oj for JSON serialization' do
      get '/'
      expect(last_response.body).to match(/"name":"E-Commerce API"/)
    end
  end

  describe 'error handling' do
    it 'returns 404 for non-existent routes' do
      get '/nonexistent'
      expect(last_response.status).to eq(404)
    end
  end

  describe 'HTTP methods' do
    it 'only accepts GET for /health' do
      post '/health'
      expect(last_response.status).to eq(404)
    end

    it 'only accepts GET for root' do
      post '/'
      expect(last_response.status).to eq(404)
    end

    it 'does not accept PUT for /health' do
      put '/health'
      expect(last_response.status).to eq(404)
    end

    it 'does not accept DELETE for /health' do
      delete '/health'
      expect(last_response.status).to eq(404)
    end
  end

  describe 'availability' do
    it 'health endpoint is always available' do
      10.times do
        get '/health'
        expect(last_response.status).to eq(200)
      end
    end

    it 'root endpoint is always available' do
      10.times do
        get '/'
        expect(last_response.status).to eq(200)
      end
    end
  end
end
