require 'spec_helper'
require_relative '../../../../lib/infrastructure/adapters/repositories/sequel_category_repository'
require_relative '../../../../config/database'

RSpec.describe Infrastructure::Adapters::Repositories::SequelCategoryRepository, db: true do
  let(:db) { Sequel.sqlite }
  let(:repository) { described_class.new(db) }

  before do
    # Create categories table
    db.create_table :categories do
      primary_key :id
      String :name, null: false
      String :slug, null: false
      Time :created_at
    end
  end

  after do
    db.drop_table?(:categories)
  end

  describe '#find_all' do
    context 'when categories exist' do
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
        db[:categories].insert(
          name: 'Books',
          slug: 'books',
          created_at: Time.now
        )
      end

      it 'returns all categories' do
        categories = repository.find_all
        expect(categories.size).to eq(3)
        expect(categories.first).to be_a(Domain::Entities::Category)
      end

      it 'maps database rows to entities correctly' do
        categories = repository.find_all
        first_category = categories.first
        expect(first_category.name).to eq('Electronics')
        expect(first_category.slug).to eq('electronics')
        expect(first_category.id).not_to be_nil
      end
    end

    context 'when no categories exist' do
      it 'returns empty array' do
        categories = repository.find_all
        expect(categories).to eq([])
      end
    end
  end

  describe '#find_by_id' do
    let!(:category_id) do
      db[:categories].insert(
        name: 'Electronics',
        slug: 'electronics',
        created_at: Time.now
      )
    end

    context 'when category exists' do
      it 'returns the category' do
        category = repository.find_by_id(category_id)
        expect(category).to be_a(Domain::Entities::Category)
        expect(category.id).to eq(category_id)
        expect(category.name).to eq('Electronics')
        expect(category.slug).to eq('electronics')
      end
    end

    context 'when category does not exist' do
      it 'returns nil' do
        category = repository.find_by_id(999)
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
        expect(category).to be_a(Domain::Entities::Category)
        expect(category.name).to eq('Electronics')
        expect(category.slug).to eq('electronics')
      end
    end

    context 'when category with slug does not exist' do
      it 'returns nil' do
        category = repository.find_by_slug('nonexistent')
        expect(category).to be_nil
      end
    end

    context 'with different slug' do
      it 'finds correct category' do
        category = repository.find_by_slug('clothing')
        expect(category.name).to eq('Clothing')
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

    it 'sets timestamp' do
      category = repository.create(category_data)
      expect(category.created_at).not_to be_nil
    end

    it 'persists to database' do
      category = repository.create(category_data)

      # Verify in database
      db_record = db[:categories].where(id: category.id).first
      expect(db_record[:name]).to eq('New Category')
      expect(db_record[:slug]).to eq('new-category')
    end
  end

  describe 'entity mapping' do
    let!(:category_id) do
      db[:categories].insert(
        name: 'Test Category',
        slug: 'test-category',
        created_at: Time.now
      )
    end

    it 'maps all required fields' do
      category = repository.find_by_id(category_id)

      expect(category.id).to eq(category_id)
      expect(category.name).to be_a(String)
      expect(category.slug).to be_a(String)
      expect(category.created_at).to be_a(Time)
    end

    it 'converts to hash correctly' do
      category = repository.find_by_id(category_id)
      hash = category.to_h

      expect(hash).to be_a(Hash)
      expect(hash['id']).to eq(category_id)
      expect(hash['name']).to eq('Test Category')
      expect(hash['slug']).to eq('test-category')
    end
  end
end
