require 'sinatra/base'
require 'oj'

module Infrastructure
  module Adapters
    module Web
      class CheckoutController < Sinatra::Base
        # Use cases are injected via class methods
        class << self
          attr_accessor :create_order_use_case,
                        :process_payment_use_case,
                        :process_existing_order_payment_use_case,
                        :get_order_use_case,
                        :update_transaction_status_use_case,
                        :payment_gateway
        end

        # POST /api/checkout/create-order
        # Creates order with customer, delivery, and processes payment
        post '/api/checkout/create-order' do
          content_type :json

          begin
            order_data = Oj.load(request.body.read, symbol_keys: true)
            order_data[:redirect_url] = "#{request.base_url}/order-confirmation"

            # Create order using Use Case
            order_result = self.class.create_order_use_case.execute(order_data)

            if order_result.failure?
              error_data = order_result.failure
              status_code = error_data[:type] == :validation_error ? 400 : 500
              halt status_code, Oj.dump({
                success: false,
                error: error_data[:message],
                details: error_data[:details]
              }, mode: :compat)
            end

            order = order_result.value!

            # Process payment if payment method is provided
            if order_data[:payment_method] && (order_data[:payment_method][:token] || order_data[:payment_method][:phone_number])
              payment_data = order.merge(
                customer_email: order_data[:customer_email],
                customer_name: order_data[:customer_name],
                customer_phone: order_data[:customer_phone],
                shipping_address: order_data[:shipping_address],
                redirect_url: order_data[:redirect_url]
              )

              payment_result = self.class.process_payment_use_case.execute(payment_data, order_data[:payment_method])

              if payment_result.failure?
                error = payment_result.failure

                # Create failed transaction record via use case
                self.class.process_payment_use_case.create_failed_transaction(
                  order,
                  order_data[:payment_method],
                  error
                )

                halt 400, Oj.dump({
                  success: false,
                  error: error[:error] || error[:message]
                }, mode: :compat)
              end

              payment = payment_result.value!

              status 201
              return Oj.dump({
                success: true,
                order: {
                  id: order[:order_id],
                  reference: order[:reference],
                  amount_in_cents: order[:amount_in_cents],
                  currency: order[:currency],
                  status: payment[:order_status]
                },
                transaction: {
                  id: payment[:wompi_data][:id],
                  status: payment[:wompi_data][:status]
                }
              }, mode: :compat)
            end

            # Return order without payment processing
            status 201
            Oj.dump({
              success: true,
              order: {
                id: order[:order_id],
                reference: order[:reference],
                amount_in_cents: order[:amount_in_cents],
                currency: order[:currency],
                status: 'pending'
              }
            }, mode: :compat)
          rescue Oj::ParseError
            status 400
            Oj.dump({ error: 'Invalid JSON' }, mode: :compat)
          rescue => e
            puts "Error in create-order: #{e.message}"
            puts e.backtrace.join("\n")
            status 500
            Oj.dump({
              error: 'Failed to create order',
              message: e.message
            }, mode: :compat)
          end
        end

        # POST /api/checkout/process-payment
        # Process payment for an existing order
        post '/api/checkout/process-payment' do
          content_type :json

          begin
            payment_data = Oj.load(request.body.read, symbol_keys: true)

            result = self.class.process_existing_order_payment_use_case.execute(payment_data)

            if result.success?
              data = result.value!
              wompi_data = data[:wompi_data]

              status 200
              Oj.dump({
                success: true,
                transaction: {
                  id: wompi_data[:id],
                  status: wompi_data[:status],
                  reference: wompi_data[:reference],
                  payment_link_url: wompi_data[:payment_link_url],
                  redirect_url: wompi_data[:redirect_url]
                }
              }, mode: :compat)
            else
              error = result.failure
              status_code = error[:type] == :not_found ? 404 : 400

              status status_code
              Oj.dump({
                success: false,
                error: error[:error] || error[:message]
              }, mode: :compat)
            end
          rescue Oj::ParseError
            status 400
            Oj.dump({ error: 'Invalid JSON' }, mode: :compat)
          rescue => e
            puts "Error in process-payment: #{e.message}"
            puts e.backtrace.join("\n")
            status 500
            Oj.dump({
              error: 'Failed to process payment',
              message: e.message
            }, mode: :compat)
          end
        end

        # GET /api/checkout/order/:reference
        # Get order details with all related data
        get '/api/checkout/order/:reference' do
          content_type :json

          begin
            result = self.class.get_order_use_case.execute(params[:reference])

            if result.success?
              order = result.value!

              status 200
              Oj.dump({
                success: true,
                order: order
              }, mode: :compat)
            else
              error = result.failure
              status_code = error[:type] == :not_found ? 404 : 500

              status status_code
              Oj.dump({
                success: false,
                error: error[:message]
              }, mode: :compat)
            end
          rescue => e
            puts "Error in get order: #{e.message}"
            puts e.backtrace.join("\n")
            status 500
            Oj.dump({
              error: 'Failed to retrieve order',
              message: e.message
            }, mode: :compat)
          end
        end

        # GET /api/checkout/transaction-status/:transaction_id
        # Poll transaction status with retries
        get '/api/checkout/transaction-status/:transaction_id' do
          content_type :json

          transaction_id = params[:transaction_id]

          begin
            result = self.class.update_transaction_status_use_case.execute(transaction_id)

            if result.success?
              data = result.value!

              # Check if it's still pending after max attempts
              if data[:status] == 'PENDING'
                status 200
                return Oj.dump({
                  success: true,
                  transaction: {
                    status: 'PENDING',
                    message: data[:message]
                  },
                  attempts: data[:attempts]
                }, mode: :compat)
              end

              # Final status reached
              status 200
              Oj.dump({
                success: true,
                transaction: {
                  id: data[:wompi_data][:id],
                  status: data[:wompi_data][:status],
                  reference: data[:wompi_data][:reference],
                  amount_in_cents: data[:wompi_data][:amount_in_cents],
                  currency: data[:wompi_data][:currency],
                  payment_method_type: data[:wompi_data][:payment_method_type],
                  status_message: data[:wompi_data][:status_message]
                }
              }, mode: :compat)
            else
              error = result.failure
              status_code = error[:type] == :not_found ? 404 : 500

              status status_code
              Oj.dump({
                success: false,
                error: error[:message]
              }, mode: :compat)
            end
          rescue => e
            puts "Error in transaction-status polling: #{e.message}"
            puts e.backtrace.join("\n")
            status 500
            Oj.dump({
              success: false,
              error: 'Failed to check transaction status',
              message: e.message
            }, mode: :compat)
          end
        end

        # GET /api/checkout/acceptance-token
        # Get payment gateway acceptance token
        get '/api/checkout/acceptance-token' do
          content_type :json

          acceptance_token = self.class.payment_gateway.get_acceptance_token

          if acceptance_token
            status 200
            Oj.dump({
              success: true,
              acceptance_token: acceptance_token
            }, mode: :compat)
          else
            status 500
            Oj.dump({
              success: false,
              error: 'Failed to get acceptance token'
            }, mode: :compat)
          end
        end

        # POST /api/checkout/webhook
        # Webhook endpoint for payment notifications
        post '/api/checkout/webhook' do
          content_type :json

          begin
            # Get raw body for signature validation
            request.body.rewind
            payload = request.body.read

            # Get signature headers
            signature = request.env['HTTP_X_SIGNATURE']
            timestamp = request.env['HTTP_X_TIMESTAMP']

            # Validate signature
            unless self.class.payment_gateway.validate_webhook_signature(payload, signature, timestamp)
              status 401
              return Oj.dump({ error: 'Invalid signature' }, mode: :compat)
            end

            # Parse webhook data
            webhook_data = Oj.load(payload, symbol_keys: true)
            event_type = webhook_data[:event]

            # Only process transaction events
            if event_type == 'transaction.updated'
              result = self.class.update_transaction_status_use_case.execute_from_webhook(webhook_data[:data])

              if result.success?
                status 200
                return Oj.dump({ success: true }, mode: :compat)
              else
                error = result.failure
                puts "Webhook processing error: #{error[:message]}"

                status 200 # Return 200 to prevent retries
                return Oj.dump({
                  success: false,
                  message: 'Transaction not found or error processing'
                }, mode: :compat)
              end
            else
              status 200
              Oj.dump({ success: true, message: 'Event ignored' }, mode: :compat)
            end
          rescue => e
            puts "Error in webhook: #{e.message}"
            puts e.backtrace.join("\n")
            status 500
            Oj.dump({
              error: 'Webhook processing failed',
              message: e.message
            }, mode: :compat)
          end
        end

      end
    end
  end
end
