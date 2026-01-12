require 'sinatra/base'
require 'rack/cors'
require 'dotenv/load'
require_relative 'config/database'
require_relative 'lib/infrastructure/adapters/repositories/sequel_product_repository'
require_relative 'lib/infrastructure/adapters/repositories/sequel_category_repository'
require_relative 'lib/application/use_cases/get_all_products'
require_relative 'lib/application/use_cases/get_product_by_id'
require_relative 'lib/application/use_cases/search_products'
require_relative 'lib/application/use_cases/get_all_categories'
require_relative 'lib/application/use_cases/create_product'
require_relative 'lib/infrastructure/adapters/web/products_controller'
require_relative 'lib/infrastructure/adapters/web/categories_controller'
require_relative 'lib/infrastructure/adapters/web/health_controller'
require_relative 'lib/infrastructure/adapters/web/checkout_controller'

class App < Sinatra::Base
  # CORS Configuration
  use Rack::Cors do
    allow do
      origins ENV['FRONTEND_URL'] || 'http://localhost:5173'
      resource '*',
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options],
        credentials: true
    end
  end

  # Dependency Injection - Setup repositories
  db = Config::Database.connection
  product_repository = Infrastructure::Adapters::Repositories::SequelProductRepository.new(db)
  category_repository = Infrastructure::Adapters::Repositories::SequelCategoryRepository.new(db)

  # Dependency Injection - Setup use cases
  use_cases = {
    get_all_products: Application::UseCases::GetAllProducts.new(product_repository),
    get_product_by_id: Application::UseCases::GetProductById.new(product_repository),
    search_products: Application::UseCases::SearchProducts.new(product_repository),
    get_all_categories: Application::UseCases::GetAllCategories.new(category_repository),
    create_product: Application::UseCases::CreateProduct.new(product_repository)
  }

  # Mount controllers
  use Infrastructure::Adapters::Web::HealthController
  use Infrastructure::Adapters::Web::ProductsController, use_cases: use_cases
  use Infrastructure::Adapters::Web::CategoriesController, use_cases: use_cases
  use Infrastructure::Adapters::Web::CheckoutController

  # Error handling
  error do
    content_type :json
    status 500
    { error: 'Internal server error' }.to_json
  end

  not_found do
    content_type :json
    status 404
    { error: 'Not found' }.to_json
  end
end
