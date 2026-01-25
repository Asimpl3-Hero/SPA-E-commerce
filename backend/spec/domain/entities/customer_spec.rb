require 'spec_helper'
require_relative '../../../lib/domain/entities/customer'

RSpec.describe Domain::Entities::Customer do
  describe '#initialize' do
    it 'creates a customer with required attributes' do
      customer = described_class.new(
        id: 1,
        email: 'test@example.com',
        full_name: 'John Doe'
      )

      expect(customer.id).to eq(1)
      expect(customer.email).to eq('test@example.com')
      expect(customer.full_name).to eq('John Doe')
    end

    it 'creates a customer with all attributes' do
      now = Time.now
      customer = described_class.new(
        id: 1,
        email: 'test@example.com',
        full_name: 'John Doe',
        phone_number: '3001234567',
        created_at: now,
        updated_at: now
      )

      expect(customer.phone_number).to eq('3001234567')
      expect(customer.created_at).to eq(now)
      expect(customer.updated_at).to eq(now)
    end

    it 'allows nil for optional attributes' do
      customer = described_class.new(
        id: 1,
        email: 'test@example.com',
        full_name: 'John Doe'
      )

      expect(customer.phone_number).to be_nil
      expect(customer.created_at).to be_nil
    end
  end

  describe '#to_h' do
    it 'returns a hash representation' do
      customer = described_class.new(
        id: 1,
        email: 'test@example.com',
        full_name: 'John Doe',
        phone_number: '3001234567'
      )

      hash = customer.to_h

      expect(hash[:id]).to eq(1)
      expect(hash[:email]).to eq('test@example.com')
      expect(hash[:full_name]).to eq('John Doe')
      expect(hash[:phone_number]).to eq('3001234567')
    end

    it 'excludes nil values' do
      customer = described_class.new(
        id: 1,
        email: 'test@example.com',
        full_name: 'John Doe'
      )

      hash = customer.to_h

      expect(hash).not_to have_key(:phone_number)
      expect(hash).not_to have_key(:created_at)
    end
  end

  describe '#valid_email?' do
    it 'returns true for valid email' do
      customer = described_class.new(
        id: 1,
        email: 'test@example.com',
        full_name: 'John Doe'
      )

      expect(customer.valid_email?).to be(true)
    end

    it 'returns true for email with subdomain' do
      customer = described_class.new(
        id: 1,
        email: 'test@mail.example.com',
        full_name: 'John Doe'
      )

      expect(customer.valid_email?).to be(true)
    end

    it 'returns false for invalid email without @' do
      customer = described_class.new(
        id: 1,
        email: 'testexample.com',
        full_name: 'John Doe'
      )

      expect(customer.valid_email?).to be(false)
    end

    it 'returns false for empty email' do
      customer = described_class.new(
        id: 1,
        email: '',
        full_name: 'John Doe'
      )

      expect(customer.valid_email?).to be(false)
    end

    it 'returns false for nil email' do
      customer = described_class.new(
        id: 1,
        email: nil,
        full_name: 'John Doe'
      )

      expect(customer.valid_email?).to be(false)
    end
  end
end
