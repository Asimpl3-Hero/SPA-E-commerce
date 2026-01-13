module TestHelpers
  def create_test_product(attributes = {})
    defaults = {
      name: 'Test Product',
      price: 100.0,
      category: 'Electronics',
      description: 'A test product',
      image: 'test.jpg',
      stock: 10
    }

    Domain::Entities::Product.new(defaults.merge(attributes))
  end

  def create_test_category(attributes = {})
    defaults = {
      id: 1,
      name: 'Test Category',
      slug: 'test-category'
    }

    Domain::Entities::Category.new(defaults.merge(attributes))
  end

  def json_response
    require 'oj'
    Oj.load(last_response.body, symbol_keys: true)
  end
end

RSpec.configure do |config|
  config.include TestHelpers
  config.include Rack::Test::Methods, type: :controller
end
