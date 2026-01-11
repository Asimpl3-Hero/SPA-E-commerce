# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::Ports::ProductRepository do
  let(:repository) { described_class.new }

  describe 'interface contract' do
    it 'defines find_all method' do
      expect(repository).to respond_to(:find_all)
    end

    it 'defines find_by_id method' do
      expect(repository).to respond_to(:find_by_id).with(1).argument
    end

    it 'defines find_by_category method' do
      expect(repository).to respond_to(:find_by_category).with(1).argument
    end

    it 'defines search method' do
      expect(repository).to respond_to(:search).with(1).argument
    end

    it 'defines create method' do
      expect(repository).to respond_to(:create).with(1).argument
    end

    it 'defines update method' do
      expect(repository).to respond_to(:update).with(2).arguments
    end

    it 'defines delete method' do
      expect(repository).to respond_to(:delete).with(1).argument
    end

    it 'defines count method' do
      expect(repository).to respond_to(:count)
    end
  end

  describe 'method signatures' do
    describe '#find_all' do
      it 'accepts filters parameter' do
        expect {
          repository.find_all(filters: { category: 'electronics' })
        }.to raise_error(NotImplementedError)
      end

      it 'accepts no parameters' do
        expect {
          repository.find_all
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#find_by_id' do
      it 'requires id parameter' do
        expect {
          repository.find_by_id(1)
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#find_by_category' do
      it 'requires category parameter' do
        expect {
          repository.find_by_category('electronics')
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#search' do
      it 'requires query parameter' do
        expect {
          repository.search('laptop')
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#create' do
      it 'requires product_data parameter' do
        expect {
          repository.create({ name: 'Test' })
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#update' do
      it 'requires id and product_data parameters' do
        expect {
          repository.update(1, { name: 'Updated' })
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#delete' do
      it 'requires id parameter' do
        expect {
          repository.delete(1)
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#count' do
      it 'accepts no parameters' do
        expect {
          repository.count
        }.to raise_error(NotImplementedError)
      end
    end
  end

  describe 'not implemented behavior' do
    it 'raises NotImplementedError for find_all' do
      expect { repository.find_all }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for find_by_id' do
      expect { repository.find_by_id(1) }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for find_by_category' do
      expect { repository.find_by_category('test') }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for search' do
      expect { repository.search('query') }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for create' do
      expect { repository.create({}) }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for update' do
      expect { repository.update(1, {}) }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for delete' do
      expect { repository.delete(1) }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for count' do
      expect { repository.count }.to raise_error(NotImplementedError)
    end
  end

  describe 'inheritance and implementation' do
    context 'with a concrete implementation' do
      let(:concrete_repository) do
        Class.new(described_class) do
          def find_all(filters: {})
            []
          end

          def find_by_id(id)
            nil
          end

          def find_by_category(category)
            []
          end

          def search(query)
            []
          end

          def create(product_data)
            product_data
          end

          def update(id, product_data)
            product_data
          end

          def delete(id)
            true
          end

          def count
            0
          end
        end
      end

      let(:instance) { concrete_repository.new }

      it 'inherits from ProductRepository' do
        expect(instance).to be_a(Application::Ports::ProductRepository)
      end

      it 'implements find_all without raising error' do
        expect { instance.find_all }.not_to raise_error
      end

      it 'implements find_by_id without raising error' do
        expect { instance.find_by_id(1) }.not_to raise_error
      end

      it 'implements find_by_category without raising error' do
        expect { instance.find_by_category('test') }.not_to raise_error
      end

      it 'implements search without raising error' do
        expect { instance.search('query') }.not_to raise_error
      end

      it 'implements create without raising error' do
        expect { instance.create({}) }.not_to raise_error
      end

      it 'implements update without raising error' do
        expect { instance.update(1, {}) }.not_to raise_error
      end

      it 'implements delete without raising error' do
        expect { instance.delete(1) }.not_to raise_error
      end

      it 'implements count without raising error' do
        expect { instance.count }.not_to raise_error
      end
    end

    context 'with partial implementation' do
      let(:partial_repository) do
        Class.new(described_class) do
          def find_all(filters: {})
            []
          end

          def find_by_id(id)
            nil
          end
        end
      end

      let(:instance) { partial_repository.new }

      it 'implements defined methods' do
        expect { instance.find_all }.not_to raise_error
        expect { instance.find_by_id(1) }.not_to raise_error
      end

      it 'raises NotImplementedError for unimplemented methods' do
        expect { instance.search('test') }.to raise_error(NotImplementedError)
        expect { instance.create({}) }.to raise_error(NotImplementedError)
      end
    end
  end

  describe 'contract enforcement' do
    it 'ensures all methods are defined in the interface' do
      methods = described_class.instance_methods(false)

      expect(methods).to include(:find_all)
      expect(methods).to include(:find_by_id)
      expect(methods).to include(:find_by_category)
      expect(methods).to include(:search)
      expect(methods).to include(:create)
      expect(methods).to include(:update)
      expect(methods).to include(:delete)
      expect(methods).to include(:count)
    end

    it 'has exactly 8 methods in the interface' do
      methods = described_class.instance_methods(false)
      expect(methods.length).to eq(8)
    end
  end
end
