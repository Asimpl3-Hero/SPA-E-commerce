require 'spec_helper'
require_relative '../../../lib/application/use_cases/get_all_categories'

RSpec.describe Application::UseCases::GetAllCategories do
  let(:category_repository) { double('CategoryRepository') }
  let(:use_case) { described_class.new(category_repository) }

  let(:category1) do
    instance_double(
      Domain::Entities::Category,
      to_h: { 'id' => 1, 'name' => 'Electronics', 'slug' => 'electronics' }
    )
  end

  let(:category2) do
    instance_double(
      Domain::Entities::Category,
      to_h: { 'id' => 2, 'name' => 'Clothing', 'slug' => 'clothing' }
    )
  end

  describe '#call' do
    context 'when categories exist' do
      it 'returns success with categories array' do
        allow(category_repository).to receive(:find_all)
          .and_return([category1, category2])

        result = use_case.call

        expect(result).to be_success
        categories = result.value!
        expect(categories).to be_an(Array)
        expect(categories.size).to eq(2)
        expect(categories.first['name']).to eq('Electronics')
        expect(categories.last['name']).to eq('Clothing')
      end
    end

    context 'when no categories exist' do
      it 'returns success with empty array' do
        allow(category_repository).to receive(:find_all)
          .and_return([])

        result = use_case.call

        expect(result).to be_success
        expect(result.value!).to eq([])
      end
    end

    context 'when repository raises an error' do
      it 'returns failure with server error' do
        allow(category_repository).to receive(:find_all)
          .and_raise(StandardError.new('Database connection failed'))

        result = use_case.call

        expect(result).to be_failure
        expect(result.failure[:type]).to eq(:server_error)
        expect(result.failure[:message]).to eq('Database connection failed')
      end
    end
  end
end
