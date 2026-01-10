require 'sinatra/base'
require 'oj'

module Infrastructure
  module Adapters
    module Web
      class CategoriesController < Sinatra::Base
        def initialize(app = nil, use_cases:)
          super(app)
          @get_all_categories = use_cases[:get_all_categories]
        end

        # GET /api/categories
        get '/api/categories' do
          content_type :json

          result = @get_all_categories.call

          result.match(
            ->(categories) {
              status 200
              Oj.dump(categories)
            },
            ->(error) {
              status 500
              Oj.dump({ error: error[:message] })
            }
          )
        end
      end
    end
  end
end
