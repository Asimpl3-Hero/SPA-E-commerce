# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::UseCases::GetAllCategories do
  let(:category_repository) { Infrastructure::Adapters::Repositories::SequelCategoryRepository.new(db) }
  let(:use_case) { described_class.new(category_repository) }

  describe '#call' do
    context 'with categories in database' do
      before do
        category_repository.create(name: 'Electronics', slug: 'electronics')
        category_repository.create(name: 'Clothing', slug: 'clothing')
        category_repository.create(name: 'Books', slug: 'books')
      end

      it 'returns all categories as hashes' do
        result = use_case.call

        expect(result).to be_success
        expect(result.value!.length).to eq(3)
        expect(result.value!).to all(be_a(Hash))
      end

      it 'includes category attributes' do
        result = use_case.call

        expect(result).to be_success
        category = result.value!.first
        expect(category).to have_key('id')
        expect(category).to have_key('name')
        expect(category).to have_key('slug')
      end

      it 'returns categories with correct data' do
        result = use_case.call

        expect(result).to be_success
        slugs = result.value!.map { |c| c['slug'] }
        expect(slugs).to contain_exactly('electronics', 'clothing', 'books')
      end
    end

    context 'with no categories' do
      it 'returns empty array' do
        result = use_case.call

        expect(result).to be_success
        expect(result.value!).to eq([])
      end
    end

    context 'when repository raises an error' do
      before do
        allow(category_repository).to receive(:find_all).and_raise(StandardError, 'Database error')
      end

      it 'returns a server error failure' do
        result = use_case.call

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database error')
      end
    end
  end
end
