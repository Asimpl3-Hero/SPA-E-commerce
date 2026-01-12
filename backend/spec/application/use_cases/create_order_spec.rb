require 'spec_helper'
require_relative '../../../lib/application/use_cases/create_order'

RSpec.describe Application::UseCases::CreateOrder do
  let(:db) { instance_double('Sequel::Database') }
  let(:customers_dataset) { instance_double('Sequel::Dataset') }
  let(:deliveries_dataset) { instance_double('Sequel::Dataset') }
  let(:orders_dataset) { instance_double('Sequel::Dataset') }
  let(:use_case) { described_class.new(db) }

  before do
    allow(db).to receive(:[]).with(:customers).and_return(customers_dataset)
    allow(db).to receive(:[]).with(:deliveries).and_return(deliveries_dataset)
    allow(db).to receive(:[]).with(:orders).and_return(orders_dataset)
  end

  describe '#execute' do
    context 'with valid order data' do
      let(:order_data) do
        {
          customer_email: 'test@example.com',
          customer_name: 'Test User',
          customer_phone: '1234567890',
          items: [{ product_id: 1, quantity: 2 }],
          amount_in_cents: 50000,
          currency: 'COP'
        }
      end

      context 'with new customer' do
        before do
          allow(customers_dataset).to receive(:where).with(email: 'test@example.com')
            .and_return(customers_dataset)
          allow(customers_dataset).to receive(:first).and_return(nil)
          allow(customers_dataset).to receive(:insert).and_return(1)
          allow(orders_dataset).to receive(:insert).and_return(1)
        end

        it 'creates a new customer and order' do
          result = use_case.execute(order_data)

          expect(result).to be_success
          expect(result.value![:order_id]).to eq(1)
          expect(result.value![:reference]).to match(/ORDER-\d+-\d+/)
        end
      end

      context 'with existing customer' do
        let(:existing_customer) { { id: 1, email: 'test@example.com' } }

        before do
          allow(customers_dataset).to receive(:where).with(email: 'test@example.com')
            .and_return(customers_dataset)
          allow(customers_dataset).to receive(:first).and_return(existing_customer)
          allow(customers_dataset).to receive(:where).with(id: 1).and_return(customers_dataset)
          allow(customers_dataset).to receive(:update).and_return(1)
          allow(orders_dataset).to receive(:insert).and_return(1)
        end

        it 'updates existing customer and creates order' do
          result = use_case.execute(order_data)

          expect(result).to be_success
          expect(result.value![:customer_id]).to eq(1)
        end
      end

      context 'with shipping address' do
        let(:order_with_shipping) do
          order_data.merge(
            shipping_address: {
              address_line_1: '123 Main St',
              city: 'Bogotá',
              region: 'Cundinamarca',
              postal_code: '110111'
            }
          )
        end

        before do
          allow(customers_dataset).to receive(:where).and_return(customers_dataset)
          allow(customers_dataset).to receive(:first).and_return(nil)
          allow(customers_dataset).to receive(:insert).and_return(1)
          allow(deliveries_dataset).to receive(:insert).and_return(1)
          allow(orders_dataset).to receive(:insert).and_return(1)
        end

        it 'creates delivery record' do
          result = use_case.execute(order_with_shipping)

          expect(result).to be_success
          expect(result.value![:delivery_id]).to eq(1)
        end
      end
    end

    context 'with invalid order data' do
      context 'when missing required fields' do
        let(:invalid_data) do
          {
            customer_email: 'test@example.com'
            # Missing customer_name, items, amount_in_cents
          }
        end

        it 'returns validation error' do
          result = use_case.execute(invalid_data)

          expect(result).to be_failure
          error = result.failure
          expect(error[:type]).to eq(:validation_error)
          expect(error[:message]).to eq('Missing required fields')
          expect(error[:details][:missing]).to include(:customer_name, :items, :amount_in_cents)
        end
      end
    end

    context 'when database error occurs' do
      let(:valid_data) do
        {
          customer_email: 'test@example.com',
          customer_name: 'Test User',
          items: [{ product_id: 1 }],
          amount_in_cents: 50000
        }
      end

      before do
        allow(customers_dataset).to receive(:where).and_raise(StandardError, 'Database connection failed')
      end

      it 'returns server error' do
        result = use_case.execute(valid_data)

        expect(result).to be_failure
        error = result.failure
        expect(error[:type]).to eq(:server_error)
        expect(error[:message]).to include('Failed to create/update customer')
      end
    end
  end
end
