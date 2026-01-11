# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Domain::ValueObjects::Result do
  describe '.success' do
    context 'without value' do
      let(:result) { described_class.success }

      it 'returns a Success monad' do
        expect(result).to be_success
      end

      it 'has nil value' do
        expect(result.value!).to be_nil
      end
    end

    context 'with value' do
      let(:value) { { id: 1, name: 'Test' } }
      let(:result) { described_class.success(value) }

      it 'returns a Success monad' do
        expect(result).to be_success
      end

      it 'wraps the value' do
        expect(result.value!).to eq(value)
      end

      it 'is not a failure' do
        expect(result).not_to be_failure
      end
    end

    context 'with different value types' do
      it 'wraps strings' do
        result = described_class.success('success')
        expect(result.value!).to eq('success')
      end

      it 'wraps integers' do
        result = described_class.success(42)
        expect(result.value!).to eq(42)
      end

      it 'wraps arrays' do
        result = described_class.success([1, 2, 3])
        expect(result.value!).to eq([1, 2, 3])
      end

      it 'wraps hashes' do
        result = described_class.success({ key: 'value' })
        expect(result.value!).to eq({ key: 'value' })
      end

      it 'wraps objects' do
        object = Object.new
        result = described_class.success(object)
        expect(result.value!).to eq(object)
      end
    end
  end

  describe '.failure' do
    context 'with error message' do
      let(:error) { 'Something went wrong' }
      let(:result) { described_class.failure(error) }

      it 'returns a Failure monad' do
        expect(result).to be_failure
      end

      it 'wraps the error' do
        expect(result.failure).to eq(error)
      end

      it 'is not a success' do
        expect(result).not_to be_success
      end
    end

    context 'with error hash' do
      let(:error) { { type: :error, message: 'Error occurred' } }
      let(:result) { described_class.failure(error) }

      it 'wraps the error hash' do
        expect(result.failure).to eq(error)
        expect(result.failure[:type]).to eq(:error)
        expect(result.failure[:message]).to eq('Error occurred')
      end
    end
  end

  describe '.validation_error' do
    context 'with message only' do
      let(:result) { described_class.validation_error('Invalid input') }

      it 'returns a Failure monad' do
        expect(result).to be_failure
      end

      it 'has validation_error type' do
        expect(result.failure[:type]).to eq(:validation_error)
      end

      it 'includes the message' do
        expect(result.failure[:message]).to eq('Invalid input')
      end

      it 'includes empty details by default' do
        expect(result.failure[:details]).to eq({})
      end
    end

    context 'with message and details' do
      let(:details) { { field: 'email', constraint: 'format' } }
      let(:result) { described_class.validation_error('Invalid email', details) }

      it 'includes the details' do
        expect(result.failure[:details]).to eq(details)
        expect(result.failure[:details][:field]).to eq('email')
        expect(result.failure[:details][:constraint]).to eq('format')
      end
    end

    context 'with multiple validation errors' do
      let(:details) do
        {
          errors: [
            { field: 'email', message: 'Invalid format' },
            { field: 'password', message: 'Too short' }
          ]
        }
      end
      let(:result) { described_class.validation_error('Validation failed', details) }

      it 'includes all validation errors in details' do
        expect(result.failure[:details][:errors]).to be_an(Array)
        expect(result.failure[:details][:errors].length).to eq(2)
      end
    end
  end

  describe '.not_found' do
    context 'with resource only' do
      let(:result) { described_class.not_found('Product') }

      it 'returns a Failure monad' do
        expect(result).to be_failure
      end

      it 'has not_found type' do
        expect(result.failure[:type]).to eq(:not_found)
      end

      it 'generates message without id' do
        expect(result.failure[:message]).to eq('Product not found')
      end
    end

    context 'with resource and id' do
      let(:result) { described_class.not_found('Product', 123) }

      it 'generates message with id' do
        expect(result.failure[:message]).to eq('Product with id 123 not found')
      end

      it 'has not_found type' do
        expect(result.failure[:type]).to eq(:not_found)
      end
    end

    context 'with different resource types' do
      it 'handles Category' do
        result = described_class.not_found('Category', 456)
        expect(result.failure[:message]).to eq('Category with id 456 not found')
      end

      it 'handles Customer' do
        result = described_class.not_found('Customer', 'abc-123')
        expect(result.failure[:message]).to eq('Customer with id abc-123 not found')
      end
    end
  end

  describe '.server_error' do
    context 'with error message' do
      let(:result) { described_class.server_error('Database connection failed') }

      it 'returns a Failure monad' do
        expect(result).to be_failure
      end

      it 'has server_error type' do
        expect(result.failure[:type]).to eq(:server_error)
      end

      it 'includes the message' do
        expect(result.failure[:message]).to eq('Database connection failed')
      end
    end

    context 'with different error messages' do
      it 'handles timeout errors' do
        result = described_class.server_error('Request timeout')
        expect(result.failure[:message]).to eq('Request timeout')
      end

      it 'handles external service errors' do
        result = described_class.server_error('Payment gateway unavailable')
        expect(result.failure[:message]).to eq('Payment gateway unavailable')
      end
    end
  end

  describe 'Railway Oriented Programming patterns' do
    context 'chaining success results' do
      it 'allows binding operations' do
        result = described_class.success(5)
          .bind { |x| described_class.success(x * 2) }
          .bind { |x| described_class.success(x + 3) }

        expect(result).to be_success
        expect(result.value!).to eq(13)
      end
    end

    context 'chaining with failure' do
      it 'short-circuits on failure' do
        result = described_class.success(5)
          .bind { |x| described_class.success(x * 2) }
          .bind { |_x| described_class.failure('Error occurred') }
          .bind { |x| described_class.success(x + 3) }

        expect(result).to be_failure
        expect(result.failure).to eq('Error occurred')
      end
    end

    context 'using fmap for transformations' do
      it 'transforms success values' do
        result = described_class.success(10)
          .fmap { |x| x * 2 }
          .fmap { |x| x + 5 }

        expect(result).to be_success
        expect(result.value!).to eq(25)
      end

      it 'preserves failure through fmap' do
        result = described_class.failure('Error')
          .fmap { |x| x * 2 }

        expect(result).to be_failure
        expect(result.failure).to eq('Error')
      end
    end

    context 'using or for defaults' do
      it 'returns success value' do
        result = described_class.success(42).or(0)
        expect(result).to eq(42)
      end

      it 'returns default on failure' do
        result = described_class.failure('Error').or(0)
        expect(result).to eq(0)
      end
    end
  end

  describe 'integration with Dry::Monads' do
    it 'includes Dry::Monads::Result' do
      expect(described_class.ancestors).to include(Dry::Monads::Result::Mixin)
    end

    it 'provides Success() method' do
      result = described_class.success(42)
      expect(result.class.name).to include('Success')
    end

    it 'provides Failure() method' do
      result = described_class.failure('error')
      expect(result.class.name).to include('Failure')
    end
  end

  describe 'error type patterns' do
    it 'distinguishes between error types' do
      validation = described_class.validation_error('Invalid')
      not_found = described_class.not_found('Product', 1)
      server = described_class.server_error('Server error')

      expect(validation.failure[:type]).to eq(:validation_error)
      expect(not_found.failure[:type]).to eq(:not_found)
      expect(server.failure[:type]).to eq(:server_error)
    end

    it 'allows type-based error handling' do
      result = described_class.not_found('Product', 123)

      case result.failure[:type]
      when :validation_error
        response = { status: 400 }
      when :not_found
        response = { status: 404 }
      when :server_error
        response = { status: 500 }
      end

      expect(response[:status]).to eq(404)
    end
  end
end
