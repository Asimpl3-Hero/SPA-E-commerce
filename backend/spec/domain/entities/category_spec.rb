require 'spec_helper'

RSpec.describe Domain::Entities::Category do
  describe '#initialize' do
    it 'creates a category with required attributes' do
      category = described_class.new(
        id: 1,
        name: 'Electronics',
        slug: 'electronics'
      )

      expect(category.id).to eq(1)
      expect(category.name).to eq('Electronics')
      expect(category.slug).to eq('electronics')
    end

    it 'accepts optional created_at attribute' do
      time = Time.now
      category = described_class.new(
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        created_at: time
      )

      expect(category.created_at).to eq(time)
    end

    it 'sets created_at to nil by default' do
      category = described_class.new(
        id: 1,
        name: 'Electronics',
        slug: 'electronics'
      )

      expect(category.created_at).to be_nil
    end
  end

  describe '#to_h' do
    it 'converts category to hash' do
      category = described_class.new(
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        created_at: Time.now
      )

      hash = category.to_h

      expect(hash['id']).to eq(1)
      expect(hash['name']).to eq('Electronics')
      expect(hash['slug']).to eq('electronics')
    end

    it 'does not include created_at in hash' do
      category = described_class.new(
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        created_at: Time.now
      )

      hash = category.to_h

      expect(hash.key?('created_at')).to be(false)
    end
  end
end
