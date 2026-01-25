module TestHelpers
  def create_test_product(attributes = {})
    defaults = {
      id: 1,
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

  def create_test_customer(attributes = {})
    defaults = {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      phone_number: '3001234567',
      created_at: Time.now,
      updated_at: Time.now
    }

    Domain::Entities::Customer.new(defaults.merge(attributes))
  end

  def create_test_delivery(attributes = {})
    defaults = {
      id: 1,
      address_line_1: 'Calle 123 #45-67',
      address_line_2: 'Apt 101',
      city: 'Bogota',
      region: 'Cundinamarca',
      country: 'CO',
      postal_code: '110111',
      phone_number: '3001234567',
      delivery_notes: 'Leave at door',
      status: 'pending',
      estimated_delivery_date: nil,
      created_at: Time.now,
      updated_at: Time.now
    }

    Domain::Entities::Delivery.new(defaults.merge(attributes))
  end

  def create_test_transaction(attributes = {})
    defaults = {
      id: 1,
      wompi_transaction_id: 'wompi-trans-123',
      reference: 'ORDER-123-4567',
      amount_in_cents: 10000,
      currency: 'COP',
      status: 'APPROVED',
      payment_method_type: 'CARD',
      payment_method_token: 'tok_test_123',
      payment_data: { id: 'wompi-trans-123', status: 'APPROVED' },
      created_at: Time.now,
      updated_at: Time.now
    }

    Domain::Entities::Transaction.new(defaults.merge(attributes))
  end

  def create_test_order(attributes = {})
    defaults = {
      id: 1,
      reference: 'ORDER-123-4567',
      customer_id: 1,
      delivery_id: 1,
      transaction_id: nil,
      amount_in_cents: 10000,
      currency: 'COP',
      status: 'pending',
      items: [{ product_id: 1, quantity: 2, price: 5000 }],
      created_at: Time.now,
      updated_at: Time.now
    }

    Domain::Entities::Order.new(defaults.merge(attributes))
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
