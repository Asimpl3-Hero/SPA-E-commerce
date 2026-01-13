require_relative '../../domain/value_objects/result'
require_relative '../../infrastructure/adapters/payment/wompi_service'
require 'oj'

module Application
  module UseCases
    class UpdateTransactionStatus
      include Dry::Monads[:result]

      def initialize(database)
        @db = database
      end

      # For polling - fetches latest status from Wompi and updates DB
      def execute(transaction_id, max_attempts: 5, delay_seconds: 3)
        final_statuses = ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']

        max_attempts.times do |attempt|
          result = fetch_from_wompi(transaction_id)
            .bind { |wompi_data| update_transaction_in_db(transaction_id, wompi_data) }
            .bind { |data| update_order_status(data) }
            .bind { |data| update_stock_if_approved(data) }
            .bind { |data| update_delivery_if_approved(data) }

          # Return result if it's a success with final status or if it's a failure
          if result.success?
            current_status = result.value![:wompi_data][:status]
            return result if final_statuses.include?(current_status)
          elsif result.failure?
            return result
          end

          # Wait before next attempt (unless it's the last attempt)
          sleep(delay_seconds) unless attempt == max_attempts - 1
        end

        # Max attempts reached, still pending
        Success({
          status: 'PENDING',
          message: 'Transaction is still being processed',
          attempts: max_attempts
        })
      end

      # For webhook - updates DB with data received from Wompi
      def execute_from_webhook(webhook_data)
        transaction_data = webhook_data[:transaction]

        find_transaction_by_wompi_id(transaction_data[:id])
          .bind { |transaction| update_transaction_in_db(transaction_data[:id], transaction_data) }
          .bind { |data| update_order_status(data) }
          .bind { |data| update_stock_if_approved(data) }
          .bind { |data| update_delivery_if_approved(data) }
      end

      private

      def fetch_from_wompi(transaction_id)
        result = Infrastructure::Adapters::Payment::WompiService.get_transaction(transaction_id)

        if result[:success]
          Success(result[:data][:data])
        else
          Failure({ type: :wompi_error, error: result[:error] })
        end
      rescue => e
        Failure({ type: :server_error, message: "Failed to fetch from Wompi: #{e.message}")
      end

      def find_transaction_by_wompi_id(wompi_transaction_id)
        transaction = @db[:transactions]
          .where(wompi_transaction_id: wompi_transaction_id)
          .first

        if transaction
          Success(transaction)
        else
          Failure({ type: :not_found, message: 'Transaction', wompi_transaction_id)
        end
      end

      def update_transaction_in_db(transaction_id, wompi_data)
        transaction_record = @db[:transactions]
          .where(wompi_transaction_id: transaction_id)
          .first

        return Failure({ type: :not_found, message: 'Transaction', transaction_id) unless transaction_record

        # Store previous status to detect status changes
        previous_status = transaction_record[:status]

        @db[:transactions].where(id: transaction_record[:id]).update(
          status: wompi_data[:status],
          payment_data: Oj.dump(wompi_data),
          updated_at: Time.now
        )

        Success({
          transaction_id: transaction_record[:id],
          wompi_data: wompi_data,
          previous_status: previous_status
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to update transaction: #{e.message}")
      end

      def update_order_status(data)
        order = @db[:orders].where(transaction_id: data[:transaction_id]).first

        return Failure({ type: :not_found, message: 'Order for transaction', data[:transaction_id]) unless order

        order_status = map_wompi_status(data[:wompi_data][:status])

        @db[:orders].where(id: order[:id]).update(
          status: order_status,
          updated_at: Time.now
        )

        Success(data.merge(
          order_id: order[:id],
          order_status: order_status,
          items: Oj.load(order[:items], symbol_keys: true),
          delivery_id: order[:delivery_id]
        ))
      rescue => e
        Failure({ type: :server_error, message: "Failed to update order status: #{e.message}")
      end

      def update_stock_if_approved(data)
        # Only update stock if status changed to APPROVED
        if data[:wompi_data][:status] == 'APPROVED' && data[:previous_status] != 'APPROVED'
          update_product_stock(data[:items], :decrement)
        end

        Success(data)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update stock: #{e.message}")
      end

      def update_delivery_if_approved(data)
        # Only update delivery if status changed to APPROVED
        if data[:wompi_data][:status] == 'APPROVED' &&
           data[:previous_status] != 'APPROVED' &&
           data[:delivery_id]

          @db[:deliveries].where(id: data[:delivery_id]).update(
            status: 'assigned',
            estimated_delivery_date: Time.now + (3 * 24 * 60 * 60),
            updated_at: Time.now
          )
        end

        Success(data)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update delivery: #{e.message}")
      end

      def map_wompi_status(wompi_status)
        case wompi_status
        when 'APPROVED'
          'approved'
        when 'DECLINED'
          'declined'
        when 'VOIDED'
          'voided'
        when 'ERROR'
          'error'
        when 'PENDING'
          'processing'
        else
          'pending'
        end
      end

      def update_product_stock(items, operation)
        items.each do |item|
          product_id = item[:product_id]
          quantity = item[:quantity]

          product = @db[:products].where(id: product_id).first
          next unless product

          if operation == :decrement
            new_stock = [product[:stock] - quantity, 0].max
            @db[:products].where(id: product_id).update(
              stock: new_stock,
              updated_at: Time.now
            )
          elsif operation == :increment
            new_stock = product[:stock] + quantity
            @db[:products].where(id: product_id).update(
              stock: new_stock,
              updated_at: Time.now
            )
          end
        end
      end
    end
  end
end
