require 'sinatra/base'
require 'oj'

module Infrastructure
  module Adapters
    module Web
      class ProductsController < Sinatra::Base
        def initialize(app = nil, use_cases:)
          super(app)
          @get_all_products = use_cases[:get_all_products]
          @get_product_by_id = use_cases[:get_product_by_id]
          @search_products = use_cases[:search_products]
          @create_product = use_cases[:create_product]
        end

        # GET /api/products
        get '/api/products' do
          content_type :json

          filters = {
            category: params[:category],
            max_price: params[:max_price]&.to_f,
            min_price: params[:min_price]&.to_f,
            sort_by: params[:sort_by]&.to_sym
          }.compact

          search_query = params[:search] || params[:q]

          result = if search_query && !search_query.strip.empty?
                    @search_products.call(query: search_query, category: params[:category])
                  else
                    @get_all_products.call(filters: filters)
                  end

          handle_result(result)
        end

        # GET /api/products/:id
        get '/api/products/:id' do
          content_type :json

          result = @get_product_by_id.call(params[:id])
          handle_result(result)
        end

        # POST /api/products
        post '/api/products' do
          content_type :json

          begin
            product_data = Oj.load(request.body.read, symbol_keys: true)
            result = @create_product.call(product_data)
            handle_result(result, success_status: 201)
          rescue Oj::ParseError
            status 400
            Oj.dump({ error: 'Invalid JSON' })
          end
        end

        private

        def handle_result(result, success_status: 200)
          result.match(
            ->(value) {
              status success_status
              Oj.dump(value)
            },
            ->(error) {
              status error_status(error[:type])
              Oj.dump({ error: error[:message], details: error[:details] }.compact)
            }
          )
        end

        def error_status(type)
          case type
          when :validation_error then 400
          when :not_found then 404
          when :server_error then 500
          else 500
          end
        end
      end
    end
  end
end
