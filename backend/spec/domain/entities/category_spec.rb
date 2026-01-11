# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Domain::Entities::Category do
  let(:required_attributes) do
    {
      id: 1,
      name: 'Electronics',
      slug: 'electronics'
    }
  end

  describe '#initialize' do
    context 'with required attributes only' do
      let(:category) { described_class.new(**required_attributes) }

      it 'creates a category' do
        expect(category).to be_a(Domain::Entities::Category)
      end

      it 'sets required attributes' do
        expect(category.id).to eq(1)
        expect(category.name).to eq('Electronics')
        expect(category.slug).to eq('electronics')
      end

      it 'sets created_at to nil by default' do
        expect(category.created_at).to be_nil
      end
    end

    context 'with all attributes' do
      let(:all_attributes) do
        required_attributes.merge(created_at: Time.now)
      end

      let(:category) { described_class.new(**all_attributes) }

      it 'sets all attributes' do
        expect(category.id).to eq(1)
        expect(category.name).to eq('Electronics')
        expect(category.slug).to eq('electronics')
        expect(category.created_at).not_to be_nil
      end
    end

    context 'with different data types' do
      it 'accepts string id' do
        category = described_class.new(**required_attributes.merge(id: '123'))
        expect(category.id).to eq('123')
      end

      it 'accepts integer id' do
        category = described_class.new(**required_attributes.merge(id: 123))
        expect(category.id).to eq(123)
      end
    end
  end

  describe '#to_h' do
    let(:category) { described_class.new(**required_attributes) }
    let(:hash) { category.to_h }

    it 'returns a hash' do
      expect(hash).to be_a(Hash)
    end

    it 'includes id' do
      expect(hash['id']).to eq(1)
    end

    it 'includes name' do
      expect(hash['name']).to eq('Electronics')
    end

    it 'includes slug' do
      expect(hash['slug']).to eq('electronics')
    end

    it 'does not include created_at' do
      expect(hash).not_to have_key('created_at')
    end

    it 'uses string keys' do
      expect(hash.keys).to all(be_a(String))
    end

    context 'with created_at timestamp' do
      let(:category) do
        described_class.new(**required_attributes.merge(created_at: Time.now))
      end

      it 'excludes created_at from hash' do
        expect(hash).not_to have_key('created_at')
      end
    end
  end

  describe 'attr_readers' do
    let(:category) { described_class.new(**required_attributes) }

    it 'provides read access to all attributes' do
      expect(category).to respond_to(:id)
      expect(category).to respond_to(:name)
      expect(category).to respond_to(:slug)
      expect(category).to respond_to(:created_at)
    end

    it 'does not provide write access' do
      expect(category).not_to respond_to(:id=)
      expect(category).not_to respond_to(:name=)
      expect(category).not_to respond_to(:slug=)
      expect(category).not_to respond_to(:created_at=)
    end
  end

  describe 'immutability' do
    let(:category) { described_class.new(**required_attributes) }

    it 'does not allow modifying attributes through setters' do
      expect(category).not_to respond_to(:id=)
      expect(category).not_to respond_to(:name=)
    end
  end
end
