require_relative '../../domain/value_objects/result'
require_relative '../../domain/entities/order'

module Application
  module UseCases
    class UpdateTransactionStatus
      include Dry::Monads[:result]

      def initialize(order_repository:, transaction_repository:, delivery_repository:, product_repository:, payment_gateway:)
        @order_repository = order_repository
        @transaction_repository = transaction_repository
        @delivery_repository = delivery_repository
        @product_repository = product_repository
        @payment_gateway = payment_gateway
      end

      # For polling - fetches latest status from payment gateway and updates DB
      def execute(transaction_id, max_attempts: 5, delay_seconds: 3)
        final_statuses = ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']

        max_attempts.times do |attempt|
          result = fetch_from_payment_gateway(transaction_id)
            .bind { |wompi_data| update_transaction_in_db(transaction_id, wompi_data) }
            .bind { |data| update_order_status(data) }
            .bind { |data| update_stock_if_approved(data) }
            .bind { |data| update_delivery_if_approved(data) }

          if result.success?
            current_status = result.value![:wompi_data][:status]
            return result if final_statuses.include?(current_status)
          elsif result.failure?
            return result
          end

          sleep(delay_seconds) unless attempt == max_attempts - 1
        end

        Success({
          status: 'PENDING',
          message: 'Transaction is still being processed',
          attempts: max_attempts
        })
      end

      # For webhook - updates DB with data received from payment gateway
      def execute_from_webhook(webhook_data)
        transaction_data = webhook_data[:transaction]

        find_transaction_by_wompi_id(transaction_data[:id])
          .bind { |_transaction| update_transaction_in_db(transaction_data[:id], transaction_data) }
          .bind { |data| update_order_status(data) }
          .bind { |data| update_stock_if_approved(data) }
          .bind { |data| update_delivery_if_approved(data) }
      end

      private

      def fetch_from_payment_gateway(transaction_id)
        result = @payment_gateway.get_transaction(transaction_id)

        if result[:success]
          Success(result[:data][:data])
        else
          Failure({ type: :wompi_error, error: result[:error] })
        end
      rescue => e
        Failure({ type: :server_error, message: "Failed to fetch from payment gateway: #{e.message}" })
      end

      def find_transaction_by_wompi_id(wompi_transaction_id)
        transaction = @transaction_repository.find_by_wompi_id(wompi_transaction_id)

        if transaction
          Success(transaction)
        else
          Failure({ type: :not_found, message: "Transaction with wompi_id #{wompi_transaction_id} not found" })
        end
      end

      def update_transaction_in_db(transaction_id, wompi_data)
        transaction = @transaction_repository.find_by_wompi_id(transaction_id)

        return Failure({ type: :not_found, message: "Transaction #{transaction_id} not found" }) unless transaction

        previous_status = transaction.status

        @transaction_repository.update_status(
          transaction.id,
          wompi_data[:status],
          payment_data: wompi_data
        )

        Success({
          transaction_id: transaction.id,
          wompi_data: wompi_data,
          previous_status: previous_status
        })
      rescue => e
        Failure({ type: :server_error, message: "Failed to update transaction: #{e.message}" })
      end

      def update_order_status(data)
        order = find_order_by_transaction(data[:transaction_id])

        return Failure({ type: :not_found, message: "Order for transaction #{data[:transaction_id]} not found" }) unless order

        order_status = Domain::Entities::Order.map_wompi_status(data[:wompi_data][:status])

        @order_repository.update_status(order.id, order_status)

        Success(data.merge(
          order_id: order.id,
          order_status: order_status,
          items: order.items,
          delivery_id: order.delivery_id
        ))
      rescue => e
        Failure({ type: :server_error, message: "Failed to update order status: #{e.message}" })
      end

      def find_order_by_transaction(transaction_id)
        # Find order that has this transaction_id
        # This requires iterating or a specific query method
        # For now, we'll use the reference from the transaction
        transaction = @transaction_repository.find_by_id(transaction_id)
        return nil unless transaction

        @order_repository.find_by_reference(transaction.reference)
      end

      def update_stock_if_approved(data)
        if data[:wompi_data][:status] == 'APPROVED' && data[:previous_status] != 'APPROVED'
          update_product_stock(data[:items], :decrement)
        end

        Success(data)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update stock: #{e.message}" })
      end

      def update_delivery_if_approved(data)
        if data[:wompi_data][:status] == 'APPROVED' &&
           data[:previous_status] != 'APPROVED' &&
           data[:delivery_id]

          estimated_date = Time.now + (3 * 24 * 60 * 60)
          @delivery_repository.update_status(
            data[:delivery_id],
            'assigned',
            estimated_delivery_date: estimated_date
          )
        end

        Success(data)
      rescue => e
        Failure({ type: :server_error, message: "Failed to update delivery: #{e.message}" })
      end

      def update_product_stock(items, operation)
        return unless items.is_a?(Array)

        items.each do |item|
          product_id = item[:product_id]
          quantity = item[:quantity]

          product = @product_repository.find_by_id(product_id)
          next unless product

          current_stock = product.stock
          new_stock = if operation == :decrement
            [current_stock - quantity, 0].max
          else
            current_stock + quantity
          end

          @product_repository.update(product_id, { stock: new_stock })
        end
      end
    end
  end
end
