require_relative '../../../application/ports/transaction_repository'
require_relative '../../../domain/entities/transaction'
require 'oj'

module Infrastructure
  module Adapters
    module Repositories
      class SequelTransactionRepository < Application::Ports::TransactionRepository
        def initialize(db)
          @db = db
          @transactions = db[:transactions]
        end

        def find_by_id(id)
          row = @transactions.where(id: id).first
          row ? map_to_entity(row) : nil
        end

        def find_by_wompi_id(wompi_transaction_id)
          row = @transactions.where(wompi_transaction_id: wompi_transaction_id).first
          row ? map_to_entity(row) : nil
        end

        def find_by_reference(reference)
          row = @transactions.where(reference: reference).first
          row ? map_to_entity(row) : nil
        end

        def create(transaction_data)
          payment_data = transaction_data[:payment_data]
          payment_data_json = payment_data.is_a?(String) ? payment_data : Oj.dump(payment_data, mode: :compat)

          id = @transactions.insert(
            wompi_transaction_id: transaction_data[:wompi_transaction_id],
            reference: transaction_data[:reference],
            amount_in_cents: transaction_data[:amount_in_cents],
            currency: transaction_data[:currency] || 'COP',
            status: transaction_data[:status],
            payment_method_type: transaction_data[:payment_method_type],
            payment_method_token: transaction_data[:payment_method_token],
            payment_data: payment_data_json,
            created_at: Time.now,
            updated_at: Time.now
          )
          find_by_id(id)
        end

        def update(id, transaction_data)
          update_data = transaction_data.dup
          if update_data[:payment_data] && !update_data[:payment_data].is_a?(String)
            update_data[:payment_data] = Oj.dump(update_data[:payment_data], mode: :compat)
          end
          update_data[:updated_at] = Time.now

          @transactions.where(id: id).update(update_data)
          find_by_id(id)
        end

        def update_status(id, status, payment_data: nil)
          update_data = { status: status }
          update_data[:payment_data] = Oj.dump(payment_data, mode: :compat) if payment_data
          update(id, update_data)
        end

        private

        def map_to_entity(row)
          payment_data = row[:payment_data]
          payment_data = Oj.load(payment_data, symbol_keys: true) if payment_data.is_a?(String)

          Domain::Entities::Transaction.new(
            id: row[:id],
            wompi_transaction_id: row[:wompi_transaction_id],
            reference: row[:reference],
            amount_in_cents: row[:amount_in_cents],
            currency: row[:currency],
            status: row[:status],
            payment_method_type: row[:payment_method_type],
            payment_method_token: row[:payment_method_token],
            payment_data: payment_data,
            created_at: row[:created_at],
            updated_at: row[:updated_at]
          )
        end
      end
    end
  end
end
