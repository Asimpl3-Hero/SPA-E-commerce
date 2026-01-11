# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Infrastructure::Adapters::Repositories::SequelCategoryRepository do
  let(:repository) { described_class.new(db) }

  describe '#find_all' do
    before do
      db[:categories].insert(name: 'Electronics', slug: 'electronics', created_at: Time.now)
      db[:categories].insert(name: 'Clothing', slug: 'clothing', created_at: Time.now)
      db[:categories].insert(name: 'Books', slug: 'books', created_at: Time.now)
    end

    it 'returns all categories' do
      categories = repository.find_all

      expect(categories.length).to eq(3)
    end

    it 'returns Category entities' do
      categories = repository.find_all

      expect(categories.first).to be_a(Domain::Entities::Category)
    end

    it 'includes all category attributes' do
      category = repository.find_all.first

      expect(category.id).not_to be_nil
      expect(category.name).not_to be_nil
      expect(category.slug).not_to be_nil
      expect(category.created_at).not_to be_nil
    end

    context 'when no categories exist' do
      before do
        db[:categories].delete
      end

      it 'returns empty array' do
        categories = repository.find_all

        expect(categories).to eq([])
      end
    end
  end

  describe '#find_by_id' do
    let(:category_id) do
      db[:categories].insert(
        name: 'Test Category',
        slug: 'test-category',
        created_at: Time.now
      )
    end

    context 'when category exists' do
      it 'returns the category' do
        category = repository.find_by_id(category_id)

        expect(category).not_to be_nil
        expect(category.id).to eq(category_id)
        expect(category.name).to eq('Test Category')
      end

      it 'returns a Category entity' do
        category = repository.find_by_id(category_id)

        expect(category).to be_a(Domain::Entities::Category)
      end

      it 'includes all attributes' do
        category = repository.find_by_id(category_id)

        expect(category.slug).to eq('test-category')
        expect(category.created_at).not_to be_nil
      end
    end

    context 'when category does not exist' do
      it 'returns nil' do
        category = repository.find_by_id(99999)

        expect(category).to be_nil
      end
    end
  end

  describe '#find_by_slug' do
    before do
      db[:categories].insert(
        name: 'Electronics',
        slug: 'electronics',
        created_at: Time.now
      )
      db[:categories].insert(
        name: 'Clothing',
        slug: 'clothing',
        created_at: Time.now
      )
    end

    context 'when category with slug exists' do
      it 'returns the category' do
        category = repository.find_by_slug('electronics')

        expect(category).not_to be_nil
        expect(category.slug).to eq('electronics')
        expect(category.name).to eq('Electronics')
      end

      it 'returns a Category entity' do
        category = repository.find_by_slug('electronics')

        expect(category).to be_a(Domain::Entities::Category)
      end
    end

    context 'when category does not exist' do
      it 'returns nil' do
        category = repository.find_by_slug('nonexistent')

        expect(category).to be_nil
      end
    end
  end

  describe '#create' do
    let(:category_data) do
      {
        name: 'New Category',
        slug: 'new-category'
      }
    end

    it 'creates a new category' do
      expect {
        repository.create(category_data)
      }.to change { db[:categories].count }.by(1)
    end

    it 'returns the created category' do
      category = repository.create(category_data)

      expect(category).to be_a(Domain::Entities::Category)
      expect(category.id).not_to be_nil
      expect(category.name).to eq('New Category')
      expect(category.slug).to eq('new-category')
    end

    it 'sets created_at timestamp' do
      category = repository.create(category_data)

      expect(category.created_at).not_to be_nil
      expect(category.created_at).to be_a(Time)
    end

    it 'stores data correctly in database' do
      category = repository.create(category_data)

      db_record = db[:categories].where(id: category.id).first
      expect(db_record[:name]).to eq('New Category')
      expect(db_record[:slug]).to eq('new-category')
    end
  end
end
