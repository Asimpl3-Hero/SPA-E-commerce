require 'sinatra/base'
require 'rack/cors'
require 'dotenv/load'
require_relative 'config/database'

# Repositories
require_relative 'lib/infrastructure/adapters/repositories/sequel_product_repository'
require_relative 'lib/infrastructure/adapters/repositories/sequel_category_repository'
require_relative 'lib/infrastructure/adapters/repositories/sequel_customer_repository'
require_relative 'lib/infrastructure/adapters/repositories/sequel_delivery_repository'
require_relative 'lib/infrastructure/adapters/repositories/sequel_order_repository'
require_relative 'lib/infrastructure/adapters/repositories/sequel_transaction_repository'

# Payment Gateway
require_relative 'lib/infrastructure/adapters/payment/wompi_payment_gateway'

# Use Cases - Products & Categories
require_relative 'lib/application/use_cases/get_all_products'
require_relative 'lib/application/use_cases/get_product_by_id'
require_relative 'lib/application/use_cases/search_products'
require_relative 'lib/application/use_cases/get_all_categories'
require_relative 'lib/application/use_cases/create_product'

# Use Cases - Checkout
require_relative 'lib/application/use_cases/create_order'
require_relative 'lib/application/use_cases/process_payment'
require_relative 'lib/application/use_cases/process_existing_order_payment'
require_relative 'lib/application/use_cases/get_order_by_reference'
require_relative 'lib/application/use_cases/update_transaction_status'

# Controllers
require_relative 'lib/infrastructure/adapters/web/products_controller'
require_relative 'lib/infrastructure/adapters/web/categories_controller'
require_relative 'lib/infrastructure/adapters/web/health_controller'
require_relative 'lib/infrastructure/adapters/web/checkout_controller'

class App < Sinatra::Base
  # Serve static files from public directory
  set :public_folder, File.join(File.dirname(__FILE__), 'public')
  set :static, true

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

  # Dependency Injection - Setup database connection
  db = Config::Database.connection

  # Dependency Injection - Setup repositories
  product_repository = Infrastructure::Adapters::Repositories::SequelProductRepository.new(db)
  category_repository = Infrastructure::Adapters::Repositories::SequelCategoryRepository.new(db)
  customer_repository = Infrastructure::Adapters::Repositories::SequelCustomerRepository.new(db)
  delivery_repository = Infrastructure::Adapters::Repositories::SequelDeliveryRepository.new(db)
  order_repository = Infrastructure::Adapters::Repositories::SequelOrderRepository.new(db)
  transaction_repository = Infrastructure::Adapters::Repositories::SequelTransactionRepository.new(db)

  # Dependency Injection - Setup payment gateway
  payment_gateway = Infrastructure::Adapters::Payment::WompiPaymentGateway.new

  # Dependency Injection - Setup use cases for Products & Categories
  use_cases = {
    get_all_products: Application::UseCases::GetAllProducts.new(product_repository),
    get_product_by_id: Application::UseCases::GetProductById.new(product_repository),
    search_products: Application::UseCases::SearchProducts.new(product_repository),
    get_all_categories: Application::UseCases::GetAllCategories.new(category_repository),
    create_product: Application::UseCases::CreateProduct.new(product_repository)
  }

  # Dependency Injection - Setup use cases for Checkout
  create_order_use_case = Application::UseCases::CreateOrder.new(
    customer_repository: customer_repository,
    delivery_repository: delivery_repository,
    order_repository: order_repository
  )

  process_payment_use_case = Application::UseCases::ProcessPayment.new(
    order_repository: order_repository,
    transaction_repository: transaction_repository,
    delivery_repository: delivery_repository,
    product_repository: product_repository,
    payment_gateway: payment_gateway
  )

  process_existing_order_payment_use_case = Application::UseCases::ProcessExistingOrderPayment.new(
    order_repository: order_repository,
    transaction_repository: transaction_repository,
    delivery_repository: delivery_repository,
    product_repository: product_repository,
    payment_gateway: payment_gateway
  )

  get_order_use_case = Application::UseCases::GetOrderByReference.new(
    order_repository: order_repository
  )

  update_transaction_status_use_case = Application::UseCases::UpdateTransactionStatus.new(
    order_repository: order_repository,
    transaction_repository: transaction_repository,
    delivery_repository: delivery_repository,
    product_repository: product_repository,
    payment_gateway: payment_gateway
  )

  # Inject use cases into CheckoutController
  Infrastructure::Adapters::Web::CheckoutController.create_order_use_case = create_order_use_case
  Infrastructure::Adapters::Web::CheckoutController.process_payment_use_case = process_payment_use_case
  Infrastructure::Adapters::Web::CheckoutController.process_existing_order_payment_use_case = process_existing_order_payment_use_case
  Infrastructure::Adapters::Web::CheckoutController.get_order_use_case = get_order_use_case
  Infrastructure::Adapters::Web::CheckoutController.update_transaction_status_use_case = update_transaction_status_use_case
  Infrastructure::Adapters::Web::CheckoutController.payment_gateway = payment_gateway

  # API Documentation routes
  get '/api-docs' do
    redirect '/swagger-ui.html'
  end

  get '/docs' do
    redirect '/swagger-ui.html'
  end

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
