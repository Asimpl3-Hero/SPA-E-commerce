# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Application::Ports::CategoryRepository do
  let(:repository) { described_class.new }

  describe 'interface contract' do
    it 'defines find_all method' do
      expect(repository).to respond_to(:find_all)
    end

    it 'defines find_by_id method' do
      expect(repository).to respond_to(:find_by_id).with(1).argument
    end

    it 'defines find_by_slug method' do
      expect(repository).to respond_to(:find_by_slug).with(1).argument
    end

    it 'defines create method' do
      expect(repository).to respond_to(:create).with(1).argument
    end
  end

  describe 'method signatures' do
    describe '#find_all' do
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

    describe '#find_by_slug' do
      it 'requires slug parameter' do
        expect {
          repository.find_by_slug('electronics')
        }.to raise_error(NotImplementedError)
      end
    end

    describe '#create' do
      it 'requires category_data parameter' do
        expect {
          repository.create({ name: 'Test', slug: 'test' })
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

    it 'raises NotImplementedError for find_by_slug' do
      expect { repository.find_by_slug('test') }.to raise_error(NotImplementedError)
    end

    it 'raises NotImplementedError for create' do
      expect { repository.create({}) }.to raise_error(NotImplementedError)
    end
  end

  describe 'inheritance and implementation' do
    context 'with a concrete implementation' do
      let(:concrete_repository) do
        Class.new(described_class) do
          def find_all
            []
          end

          def find_by_id(id)
            nil
          end

          def find_by_slug(slug)
            nil
          end

          def create(category_data)
            category_data
          end
        end
      end

      let(:instance) { concrete_repository.new }

      it 'inherits from CategoryRepository' do
        expect(instance).to be_a(Application::Ports::CategoryRepository)
      end

      it 'implements find_all without raising error' do
        expect { instance.find_all }.not_to raise_error
      end

      it 'implements find_by_id without raising error' do
        expect { instance.find_by_id(1) }.not_to raise_error
      end

      it 'implements find_by_slug without raising error' do
        expect { instance.find_by_slug('test') }.not_to raise_error
      end

      it 'implements create without raising error' do
        expect { instance.create({}) }.not_to raise_error
      end
    end

    context 'with partial implementation' do
      let(:partial_repository) do
        Class.new(described_class) do
          def find_all
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
        expect { instance.find_by_slug('test') }.to raise_error(NotImplementedError)
        expect { instance.create({}) }.to raise_error(NotImplementedError)
      end
    end
  end

  describe 'contract enforcement' do
    it 'ensures all methods are defined in the interface' do
      methods = described_class.instance_methods(false)

      expect(methods).to include(:find_all)
      expect(methods).to include(:find_by_id)
      expect(methods).to include(:find_by_slug)
      expect(methods).to include(:create)
    end

    it 'has exactly 4 methods in the interface' do
      methods = described_class.instance_methods(false)
      expect(methods.length).to eq(4)
    end
  end

  describe 'comparison with ProductRepository' do
    it 'has fewer methods than ProductRepository' do
      product_methods = Application::Ports::ProductRepository.instance_methods(false).length
      category_methods = described_class.instance_methods(false).length

      expect(category_methods).to be < product_methods
    end

    it 'does not include update method' do
      expect(repository).not_to respond_to(:update)
    end

    it 'does not include delete method' do
      expect(repository).not_to respond_to(:delete)
    end

    it 'does not include search method' do
      expect(repository).not_to respond_to(:search)
    end

    it 'does not include count method' do
      expect(repository).not_to respond_to(:count)
    end

    it 'does not include find_by_category method' do
      expect(repository).not_to respond_to(:find_by_category)
    end
  end

  describe 'method availability' do
    it 'only exposes repository interface methods' do
      public_methods = described_class.instance_methods(false)

      expect(public_methods).to match_array([
        :find_all,
        :find_by_id,
        :find_by_slug,
        :create
      ])
    end
  end
end
