# frozen_string_literal: true

module TestHelpers
  def app
    App
  end

  def db
    Config::Database.connection
  end

  def json_response
    JSON.parse(last_response.body, symbolize_names: true)
  end

  def create_test_product(attributes = {})
    db[:products].insert(
      name: attributes[:name] || 'Test Product',
      description: attributes[:description] || 'Test Description',
      price: attributes[:price] || 10000,
      stock: attributes[:stock] || 10,
      image: attributes[:image] || attributes[:image_url] || 'https://example.com/image.jpg',
      category: attributes[:category] || 'electronics',
      rating: attributes[:rating] || 0.0,
      reviews: attributes[:reviews] || 0,
      original_price: attributes[:original_price],
      badge_text: attributes[:badge_text],
      badge_variant: attributes[:badge_variant],
      created_at: Time.now,
      updated_at: Time.now
    )
  end

  def create_test_customer(attributes = {})
    db[:customers].insert(
      email: attributes[:email] || 'test@example.com',
      full_name: attributes[:full_name] || 'Test User',
      phone_number: attributes[:phone_number] || '+573001234567',
      created_at: Time.now,
      updated_at: Time.now
    )
  end

  def create_test_transaction(attributes = {})
    db[:transactions].insert(
      wompi_transaction_id: attributes[:wompi_transaction_id] || "test-#{SecureRandom.hex(8)}",
      status: attributes[:status] || 'PENDING',
      amount_in_cents: attributes[:amount_in_cents] || 10000,
      currency: attributes[:currency] || 'COP',
      payment_method_type: attributes[:payment_method_type] || 'CARD',
      payment_data: Sequel.pg_jsonb(attributes[:payment_data] || {}),
      signature: attributes[:signature] || 'test-signature',
      created_at: Time.now,
      updated_at: Time.now
    )
  end

  def create_test_delivery(attributes = {})
    db[:deliveries].insert(
      address_line_1: attributes[:address_line_1] || 'Calle 123',
      city: attributes[:city] || 'Bogota',
      region: attributes[:region] || 'Bogota DC',
      country: attributes[:country] || 'CO',
      phone_number: attributes[:phone_number] || '+573001234567',
      status: attributes[:status] || 'pending',
      created_at: Time.now,
      updated_at: Time.now
    )
  end

  def create_test_order(customer_id:, transaction_id: nil, delivery_id: nil, attributes: {})
    db[:orders].insert(
      customer_id: customer_id,
      transaction_id: transaction_id,
      delivery_id: delivery_id,
      status: attributes[:status] || 'pending',
      total_amount_in_cents: attributes[:total_amount_in_cents] || 10000,
      items: Sequel.pg_jsonb(attributes[:items] || []),
      created_at: Time.now,
      updated_at: Time.now
    )
  end
end

RSpec.configure do |config|
  config.include TestHelpers
end
