require 'spec_helper'
require_relative '../../../lib/application/use_cases/get_order_by_reference'

RSpec.describe Application::UseCases::GetOrderByReference do
  let(:order_repository) { double('OrderRepository') }

  let(:use_case) do
    described_class.new(order_repository: order_repository)
  end

  let(:order_details) do
    {
      order: {
        id: 1,
        reference: 'ORDER-123',
        amount_in_cents: 10000,
        currency: 'COP',
        status: 'approved',
        items: [{ product_id: 1, quantity: 2 }],
        created_at: Time.now,
        updated_at: Time.now
      },
      customer: {
        id: 1,
        email: 'customer@test.com',
        full_name: 'Test Customer',
        phone_number: '3001234567'
      },
      transaction: {
        id: 1,
        wompi_transaction_id: 'wompi-123',
        status: 'APPROVED'
      },
      delivery: {
        id: 1,
        address_line_1: 'Calle 123',
        address_line_2: 'Apt 101',
        city: 'Bogota',
        region: 'Cundinamarca',
        country: 'CO',
        postal_code: '110111',
        status: 'assigned'
      }
    }
  end

  describe '#execute' do
    context 'when order exists with all details' do
      before do
        allow(order_repository).to receive(:find_with_details)
          .with('ORDER-123')
          .and_return(order_details)
      end

      it 'returns success' do
        result = use_case.execute('ORDER-123')

        expect(result).to be_success
      end

      it 'includes order data' do
        result = use_case.execute('ORDER-123')
        data = result.value!

        expect(data[:id]).to eq(1)
        expect(data[:reference]).to eq('ORDER-123')
        expect(data[:status]).to eq('approved')
      end

      it 'includes customer data' do
        result = use_case.execute('ORDER-123')
        data = result.value!

        expect(data[:customer_email]).to eq('customer@test.com')
        expect(data[:customer_name]).to eq('Test Customer')
      end

      it 'includes transaction data' do
        result = use_case.execute('ORDER-123')
        data = result.value!

        expect(data[:wompi_transaction_id]).to eq('wompi-123')
        expect(data[:transaction_status]).to eq('APPROVED')
      end

      it 'includes shipping address' do
        result = use_case.execute('ORDER-123')
        data = result.value!

        expect(data[:shipping_address]).not_to be_nil
        expect(data[:shipping_address][:city]).to eq('Bogota')
      end
    end

    context 'when order exists without optional data' do
      let(:minimal_order_details) do
        {
          order: {
            id: 1,
            reference: 'ORDER-456',
            amount_in_cents: 5000,
            currency: 'COP',
            status: 'pending',
            items: [],
            created_at: Time.now,
            updated_at: Time.now
          },
          customer: nil,
          transaction: nil,
          delivery: nil
        }
      end

      before do
        allow(order_repository).to receive(:find_with_details)
          .with('ORDER-456')
          .and_return(minimal_order_details)
      end

      it 'returns success' do
        result = use_case.execute('ORDER-456')

        expect(result).to be_success
      end

      it 'does not include nil fields' do
        result = use_case.execute('ORDER-456')
        data = result.value!

        expect(data[:shipping_address]).to be_nil
      end
    end

    context 'when order does not exist' do
      before do
        allow(order_repository).to receive(:find_with_details)
          .with('NONEXISTENT')
          .and_return(nil)
      end

      it 'returns not found error' do
        result = use_case.execute('NONEXISTENT')

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:not_found)
        expect(result.failure[:message]).to eq('Order not found')
      end
    end

    context 'when reference is nil' do
      it 'returns validation error' do
        result = use_case.execute(nil)

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
      end
    end

    context 'when reference is empty' do
      it 'returns validation error' do
        result = use_case.execute('')

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:validation_error)
      end
    end

    context 'when repository raises error' do
      before do
        allow(order_repository).to receive(:find_with_details)
          .and_raise(StandardError.new('Database error'))
      end

      it 'returns server error' do
        result = use_case.execute('ORDER-123')

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
      end
    end
  end
end
