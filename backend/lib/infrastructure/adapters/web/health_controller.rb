require 'sinatra/base'
require 'oj'

module Infrastructure
  module Adapters
    module Web
      class HealthController < Sinatra::Base
        # GET /health
        get '/health' do
          content_type :json
          status 200
          Oj.dump({ status: 'ok', timestamp: Time.now.iso8601 })
        end

        # GET /
        get '/' do
          content_type :json
          status 200
          Oj.dump({
            name: 'E-Commerce API',
            version: '1.0.0',
            endpoints: {
              health: '/health',
              products: '/api/products',
              categories: '/api/categories'
            }
          })
        end
      end
    end
  end
end
