require 'spec_helper'

RSpec.describe Domain::ValueObjects::Result do
  describe '.success' do
    it 'creates a success result with value' do
      result = described_class.success('test value')
      expect(result.success?).to be(true)
      expect(result.value!).to eq('test value')
    end

    it 'creates a success result without value' do
      result = described_class.success
      expect(result.success?).to be(true)
      expect(result.value!).to be_nil
    end

    it 'can wrap complex objects' do
      data = { id: 1, name: 'Test' }
      result = described_class.success(data)
      expect(result.success?).to be(true)
      expect(result.value!).to eq(data)
    end
  end

  describe '.failure' do
    it 'creates a failure result with error' do
      error = { message: 'Error occurred' }
      result = described_class.failure(error)
      expect(result.failure?).to be(true)
      expect(result.failure).to eq(error)
    end

    it 'wraps any error value' do
      result = described_class.failure('simple error')
      expect(result.failure?).to be(true)
      expect(result.failure).to eq('simple error')
    end
  end

  describe '.validation_error' do
    it 'creates a validation error failure' do
      result = described_class.validation_error('Invalid data')
      expect(result.failure?).to be(true)
      expect(result.failure[:type]).to eq(:validation_error)
      expect(result.failure[:message]).to eq('Invalid data')
    end

    it 'includes details when provided' do
      details = { field: 'email', reason: 'invalid format' }
      result = described_class.validation_error('Invalid email', details)

      expect(result.failure?).to be(true)
      expect(result.failure[:type]).to eq(:validation_error)
      expect(result.failure[:message]).to eq('Invalid email')
      expect(result.failure[:details]).to eq(details)
    end

    it 'creates validation error without details' do
      result = described_class.validation_error('Invalid data')
      expect(result.failure[:details]).to eq({})
    end
  end

  describe '.not_found' do
    it 'creates a not found error with resource and id' do
      result = described_class.not_found('Product', 123)

      expect(result.failure?).to be(true)
      expect(result.failure[:type]).to eq(:not_found)
      expect(result.failure[:message]).to eq('Product with id 123 not found')
    end

    it 'creates a not found error without id' do
      result = described_class.not_found('User')

      expect(result.failure?).to be(true)
      expect(result.failure[:type]).to eq(:not_found)
      expect(result.failure[:message]).to eq('User not found')
    end
  end

  describe '.server_error' do
    it 'creates a server error failure' do
      result = described_class.server_error('Database connection failed')

      expect(result.failure?).to be(true)
      expect(result.failure[:type]).to eq(:server_error)
      expect(result.failure[:message]).to eq('Database connection failed')
    end
  end

  describe 'result pattern matching' do
    it 'can be used in success case' do
      result = described_class.success(42)
      value = result.value_or(0)
      expect(value).to eq(42)
    end

    it 'can be used in failure case' do
      result = described_class.failure('error')
      value = result.value_or(0)
      expect(value).to eq(0)
    end
  end

  describe 'monadic behavior' do
    it 'supports fmap for success' do
      result = described_class.success(10)
      mapped = result.fmap { |v| v * 2 }

      expect(mapped.success?).to be(true)
      expect(mapped.value!).to eq(20)
    end

    it 'fmap does not execute on failure' do
      result = described_class.failure('error')
      mapped = result.fmap { |v| v * 2 }

      expect(mapped.failure?).to be(true)
      expect(mapped.failure).to eq('error')
    end

    it 'supports bind for success' do
      result = described_class.success(10)
      bound = result.bind { |v| described_class.success(v * 2) }

      expect(bound.success?).to be(true)
      expect(bound.value!).to eq(20)
    end

    it 'bind propagates failure' do
      result = described_class.failure('error')
      bound = result.bind { |v| described_class.success(v * 2) }

      expect(bound.failure?).to be(true)
      expect(bound.failure).to eq('error')
    end

    it 'can chain operations with bind' do
      result = described_class.success(5)
        .bind { |v| described_class.success(v * 2) }
        .bind { |v| described_class.success(v + 3) }

      expect(result.success?).to be(true)
      expect(result.value!).to eq(13)
    end

    it 'stops at first failure in chain' do
      result = described_class.success(5)
        .bind { |v| described_class.success(v * 2) }
        .bind { |_v| described_class.failure('error occurred') }
        .bind { |v| described_class.success(v + 100) }

      expect(result.failure?).to be(true)
      expect(result.failure).to eq('error occurred')
    end
  end
end
