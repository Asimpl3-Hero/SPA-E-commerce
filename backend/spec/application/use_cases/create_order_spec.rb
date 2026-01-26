require 'spec_helper'
require_relative '../../../lib/application/use_cases/create_order'
require_relative '../../../lib/domain/entities/customer'
require_relative '../../../lib/domain/entities/delivery'
require_relative '../../../lib/domain/entities/order'
require_relative '../../../lib/domain/entities/product'

RSpec.describe Application::UseCases::CreateOrder do
  let(:customer_repository) { double('CustomerRepository') }
  let(:delivery_repository) { double('DeliveryRepository') }
  let(:order_repository) { double('OrderRepository') }
  let(:product_repository) { double('ProductRepository') }

  let(:use_case) do
    described_class.new(
      customer_repository: customer_repository,
      delivery_repository: delivery_repository,
      order_repository: order_repository,
      product_repository: product_repository
    )
  end

  # Product with price 30000 COP, quantity 2
  # subtotal = 60000 (>= 50000, free shipping)
  # shipping = 0
  # total = 60000 COP = 6000000 centavos
  let(:product) do
    Domain::Entities::Product.new(
      id: 1,
      name: 'Test Product',
      price: 30000,
      category: 'test',
      description: 'Test description',
      image: 'test.jpg',
      stock: 10
    )
  end

  let(:valid_order_data) do
    {
      customer_email: 'test@example.com',
      customer_name: 'John Doe',
      customer_phone: '3001234567',
      items: [{ product_id: 1, quantity: 2 }],
      amount_in_cents: 6000000,
      currency: 'COP'
    }
  end

  let(:customer) do
    instance_double(
      Domain::Entities::Customer,
      id: 1,
      email: 'test@example.com',
      full_name: 'John Doe'
    )
  end

  let(:order) do
    instance_double(
      Domain::Entities::Order,
      id: 1,
      reference: 'ORDER-123-4567',
      customer_id: 1,
      delivery_id: nil,
      amount_in_cents: 6000000,
      currency: 'COP',
      items: [{ product_id: 1, quantity: 2 }]
    )
  end

  describe '#execute' do
    context 'with valid order data without shipping' do
      before do
        allow(product_repository).to receive(:find_by_id).with(1).and_return(product)
        allow(customer_repository).to receive(:create_or_update_by_email)
          .and_return(customer)
        allow(order_repository).to receive(:create)
          .and_return(order)
      end

      it 'returns success' do
        result = use_case.execute(valid_order_data)

        expect(result).to be_success
      end

      it 'validates amount against database prices' do
        expect(product_repository).to receive(:find_by_id).with(1).and_return(product)

        use_case.execute(valid_order_data)
      end

      it 'creates or updates customer' do
        expect(customer_repository).to receive(:create_or_update_by_email).with({
          email: 'test@example.com',
          full_name: 'John Doe',
          phone_number: '3001234567'
        })

        use_case.execute(valid_order_data)
      end

      it 'creates order with calculated amount' do
        expect(order_repository).to receive(:create).with(hash_including(
          customer_id: 1,
          amount_in_cents: 6000000
        ))

        use_case.execute(valid_order_data)
      end

      it 'returns order data' do
        result = use_case.execute(valid_order_data)

        expect(result.value![:order_id]).to eq(1)
        expect(result.value![:reference]).to eq('ORDER-123-4567')
      end
    end

    context 'with valid order data with shipping cost' do
      # Product with price 10000 COP, quantity 2
      # subtotal = 20000 (< 50000, shipping applies)
      # shipping = 10000
      # total = 30000 COP = 3000000 centavos
      let(:cheap_product) do
        Domain::Entities::Product.new(
          id: 2,
          name: 'Cheap Product',
          price: 10000,
          category: 'test',
          description: 'Test description',
          image: 'test.jpg',
          stock: 10
        )
      end

      let(:order_data_with_shipping_cost) do
        {
          customer_email: 'test@example.com',
          customer_name: 'John Doe',
          customer_phone: '3001234567',
          items: [{ product_id: 2, quantity: 2 }],
          amount_in_cents: 3000000,
          currency: 'COP'
        }
      end

      let(:order_with_shipping_cost) do
        instance_double(
          Domain::Entities::Order,
          id: 1,
          reference: 'ORDER-123-4567',
          customer_id: 1,
          delivery_id: nil,
          amount_in_cents: 3000000,
          currency: 'COP',
          items: [{ product_id: 2, quantity: 2 }]
        )
      end

      before do
        allow(product_repository).to receive(:find_by_id).with(2).and_return(cheap_product)
        allow(customer_repository).to receive(:create_or_update_by_email)
          .and_return(customer)
        allow(order_repository).to receive(:create)
          .and_return(order_with_shipping_cost)
      end

      it 'includes shipping cost in total calculation' do
        result = use_case.execute(order_data_with_shipping_cost)

        expect(result).to be_success
      end
    end

    context 'with valid order data with delivery address' do
      let(:order_data_with_delivery) do
        valid_order_data.merge(
          shipping_address: {
            address_line_1: 'Calle 123 #45-67',
            city: 'Bogota',
            region: 'Cundinamarca',
            country: 'CO'
          }
        )
      end

      let(:delivery) do
        instance_double(Domain::Entities::Delivery, id: 10)
      end

      let(:order_with_delivery) do
        instance_double(
          Domain::Entities::Order,
          id: 1,
          reference: 'ORDER-123-4567',
          customer_id: 1,
          delivery_id: 10,
          amount_in_cents: 6000000,
          currency: 'COP',
          items: []
        )
      end

      before do
        allow(product_repository).to receive(:find_by_id).with(1).and_return(product)
        allow(customer_repository).to receive(:create_or_update_by_email)
          .and_return(customer)
        allow(delivery_repository).to receive(:create)
          .and_return(delivery)
        allow(order_repository).to receive(:create)
          .and_return(order_with_delivery)
      end

      it 'creates delivery' do
        expect(delivery_repository).to receive(:create).with(hash_including(
          address_line_1: 'Calle 123 #45-67',
          city: 'Bogota'
        ))

        use_case.execute(order_data_with_delivery)
      end

      it 'creates order with delivery_id' do
        expect(order_repository).to receive(:create).with(hash_including(
          delivery_id: 10
        ))

        use_case.execute(order_data_with_delivery)
      end
    end

    context 'when amount does not match calculated total' do
      let(:manipulated_order_data) do
        valid_order_data.merge(amount_in_cents: 100) # Trying to pay only 1 COP
      end

      before do
        allow(product_repository).to receive(:find_by_id).with(1).and_return(product)
      end

      it 'returns price mismatch error' do
        result = use_case.execute(manipulated_order_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:price_mismatch)
        expect(result.failure[:details][:provided]).to eq(100)
        expect(result.failure[:details][:calculated]).to eq(6000000)
      end

      it 'does not create customer' do
        expect(customer_repository).not_to receive(:create_or_update_by_email)

        use_case.execute(manipulated_order_data)
      end

      it 'does not create order' do
        expect(order_repository).not_to receive(:create)

        use_case.execute(manipulated_order_data)
      end
    end

    context 'when product is not found' do
      let(:order_with_invalid_product) do
        {
          customer_email: 'test@example.com',
          customer_name: 'John Doe',
          customer_phone: '3001234567',
          items: [{ product_id: 999, quantity: 1 }],
          amount_in_cents: 100000,
          currency: 'COP'
        }
      end

      before do
        allow(product_repository).to receive(:find_by_id).with(999).and_return(nil)
      end

      it 'returns validation error' do
        result = use_case.execute(order_with_invalid_product)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:message]).to include('Product with ID 999 not found')
      end
    end

    context 'when customer_email is missing' do
      let(:invalid_data) { valid_order_data.tap { |d| d.delete(:customer_email) } }

      it 'returns validation error' do
        result = use_case.execute(invalid_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
        expect(result.failure[:details][:missing]).to include(:customer_email)
      end
    end

    context 'when items is missing' do
      let(:invalid_data) { valid_order_data.tap { |d| d.delete(:items) } }

      it 'returns validation error' do
        result = use_case.execute(invalid_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
      end
    end

    context 'when amount_in_cents is missing' do
      let(:invalid_data) { valid_order_data.tap { |d| d.delete(:amount_in_cents) } }

      it 'returns validation error' do
        result = use_case.execute(invalid_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
      end
    end

    context 'when customer repository raises error' do
      before do
        allow(product_repository).to receive(:find_by_id).with(1).and_return(product)
        allow(customer_repository).to receive(:create_or_update_by_email)
          .and_raise(StandardError.new('Database error'))
      end

      it 'returns server error' do
        result = use_case.execute(valid_order_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to include('customer')
      end
    end

    context 'when order repository raises error' do
      before do
        allow(product_repository).to receive(:find_by_id).with(1).and_return(product)
        allow(customer_repository).to receive(:create_or_update_by_email)
          .and_return(customer)
        allow(order_repository).to receive(:create)
          .and_raise(StandardError.new('Database error'))
      end

      it 'returns server error' do
        result = use_case.execute(valid_order_data)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to include('order')
      end
    end
  end
end
