require 'sinatra/base'
require 'oj'
require_relative '../../../../config/database'
require_relative '../payment/wompi_service'
require_relative '../../../application/use_cases/create_order'
require_relative '../../../application/use_cases/process_payment'
require_relative '../../../application/use_cases/update_transaction_status'

module Infrastructure
  module Adapters
    module Web
      class CheckoutController < Sinatra::Base
        # Database connection
        DB = Config::Database.connection

        # POST /api/checkout/create-order
        # Creates order with customer, delivery, and processes payment with Wompi
        post '/api/checkout/create-order' do
          content_type :json

          begin
            order_data = Oj.load(request.body.read, symbol_keys: true)
            order_data[:redirect_url] = "#{request.base_url}/order-confirmation"

            # Start database transaction for atomicity
            result = DB.transaction do
              # Create order using Use Case
              create_order_uc = Application::UseCases::CreateOrder.new(DB)
              order_result = create_order_uc.execute(order_data)

              # Handle order creation failure
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
                process_payment_uc = Application::UseCases::ProcessPayment.new(DB)

                payment_data = order.merge(
                  customer_email: order_data[:customer_email],
                  customer_name: order_data[:customer_name],
                  customer_phone: order_data[:customer_phone],
                  shipping_address: order_data[:shipping_address],
                  redirect_url: order_data[:redirect_url]
                )

                payment_result = process_payment_uc.execute(payment_data, order_data[:payment_method])

                if payment_result.failure?
                  error = payment_result.failure

                  # Create failed transaction record
                  payment_type = order_data[:payment_method][:type] || 'CARD'
                  transaction_id = DB[:transactions].insert(
                    reference: order[:reference],
                    amount_in_cents: order[:amount_in_cents],
                    currency: order[:currency],
                    status: 'ERROR',
                    payment_method_type: payment_type,
                    payment_data: Oj.dump(error),
                    created_at: Time.now,
                    updated_at: Time.now
                  )

                  DB[:orders].where(id: order[:order_id]).update(
                    transaction_id: transaction_id,
                    status: 'error',
                    updated_at: Time.now
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
              {
                success: true,
                order: {
                  id: order[:order_id],
                  reference: order[:reference],
                  amount_in_cents: order[:amount_in_cents],
                  currency: order[:currency],
                  status: 'pending'
                }
              }
            end # DB.transaction

            status 201
            Oj.dump(result, mode: :compat)
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

            # Find order by reference with joins
            order = DB[:orders]
              .left_join(:customers, id: :customer_id)
              .left_join(:deliveries, id: :delivery_id)
              .where(Sequel[:orders][:reference] => payment_data[:reference])
              .select(
                Sequel[:orders][:id].as(:order_id),
                Sequel[:orders][:reference],
                Sequel[:orders][:amount_in_cents],
                Sequel[:orders][:currency],
                Sequel[:orders][:items],
                Sequel[:customers][:email].as(:customer_email),
                Sequel[:customers][:full_name].as(:customer_name),
                Sequel[:customers][:phone_number].as(:customer_phone),
                Sequel[:deliveries][:id].as(:delivery_id)
              )
              .first

            unless order
              status 404
              return Oj.dump({ error: 'Order not found' }, mode: :compat)
            end

            DB.transaction do
              # Get acceptance token from Wompi
              acceptance_token = Payment::WompiService.get_acceptance_token

              unless acceptance_token
                status 500
                return Oj.dump({ error: 'Failed to get acceptance token' }, mode: :compat)
              end

              # Get shipping address if exists
              shipping_address = nil
              if order[:delivery_id]
                delivery = DB[:deliveries].where(id: order[:delivery_id]).first
                if delivery
                  shipping_address = {
                    address_line_1: delivery[:address_line_1],
                    address_line_2: delivery[:address_line_2],
                    city: delivery[:city],
                    region: delivery[:region],
                    country: delivery[:country],
                    postal_code: delivery[:postal_code],
                    phone_number: delivery[:phone_number]
                  }
                end
              end

              # Create transaction with Wompi
              transaction_params = {
                acceptance_token: acceptance_token[:acceptance_token],
                amount_in_cents: order[:amount_in_cents],
                currency: order[:currency],
                customer_email: order[:customer_email],
                full_name: order[:customer_name],
                phone_number: order[:customer_phone],
                payment_method_type: payment_data[:payment_method_type],
                payment_token: payment_data[:payment_token],
                reference: order[:reference],
                redirect_url: payment_data[:redirect_url],
                shipping_address: shipping_address
              }

              result = Payment::WompiService.create_transaction(transaction_params)

              if result[:success]
                wompi_data = result[:data][:data]

                # Create transaction record
                transaction_id = DB[:transactions].insert(
                  wompi_transaction_id: wompi_data[:id],
                  reference: order[:reference],
                  amount_in_cents: order[:amount_in_cents],
                  currency: order[:currency],
                  status: wompi_data[:status],
                  payment_method_type: payment_data[:payment_method_type],
                  payment_method_token: payment_data[:payment_token],
                  payment_data: Oj.dump(wompi_data),
                  created_at: Time.now,
                  updated_at: Time.now
                )

                # Update order
                order_status = map_wompi_status(wompi_data[:status])
                DB[:orders].where(id: order[:order_id]).update(
                  transaction_id: transaction_id,
                  status: order_status,
                  updated_at: Time.now
                )

                # Update stock if approved
                if wompi_data[:status] == 'APPROVED'
                  items = Oj.load(order[:items], symbol_keys: true)
                  update_product_stock(items, :decrement)

                  # Update delivery status
                  if order[:delivery_id]
                    DB[:deliveries].where(id: order[:delivery_id]).update(
                      status: 'assigned',
                      estimated_delivery_date: Time.now + (3 * 24 * 60 * 60),
                      updated_at: Time.now
                    )
                  end
                end

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
                # Create failed transaction
                transaction_id = DB[:transactions].insert(
                  reference: order[:reference],
                  amount_in_cents: order[:amount_in_cents],
                  currency: order[:currency],
                  status: 'ERROR',
                  payment_method_type: payment_data[:payment_method_type],
                  payment_data: Oj.dump(result[:error]),
                  created_at: Time.now,
                  updated_at: Time.now
                )

                # Update order status to error
                DB[:orders].where(id: order[:order_id]).update(
                  transaction_id: transaction_id,
                  status: 'error',
                  updated_at: Time.now
                )

                status 400
                Oj.dump({
                  success: false,
                  error: result[:error]
                }, mode: :compat)
              end
            end # DB.transaction
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
            # Get order with all related data
            order = DB[:orders]
              .left_join(:customers, id: Sequel[:orders][:customer_id])
              .left_join(:transactions, id: Sequel[:orders][:transaction_id])
              .left_join(:deliveries, id: Sequel[:orders][:delivery_id])
              .where(Sequel[:orders][:reference] => params[:reference])
              .select(
                Sequel[:orders][:id].as(:order_id),
                Sequel[:orders][:reference],
                Sequel[:orders][:amount_in_cents],
                Sequel[:orders][:currency],
                Sequel[:orders][:status],
                Sequel[:orders][:items],
                Sequel[:orders][:created_at],
                Sequel[:orders][:updated_at],
                Sequel[:customers][:email].as(:customer_email),
                Sequel[:customers][:full_name].as(:customer_name),
                Sequel[:customers][:phone_number].as(:customer_phone),
                Sequel[:transactions][:wompi_transaction_id],
                Sequel[:transactions][:status].as(:transaction_status),
                Sequel[:deliveries][:address_line_1],
                Sequel[:deliveries][:address_line_2],
                Sequel[:deliveries][:city],
                Sequel[:deliveries][:region],
                Sequel[:deliveries][:country],
                Sequel[:deliveries][:postal_code],
                Sequel[:deliveries][:status].as(:delivery_status)
              )
              .first

            unless order
              status 404
              return Oj.dump({ error: 'Order not found' }, mode: :compat)
            end

            # Build shipping address if exists
            shipping_address = nil
            if order[:address_line_1]
              shipping_address = {
                address_line_1: order[:address_line_1],
                address_line_2: order[:address_line_2],
                city: order[:city],
                region: order[:region],
                country: order[:country],
                postal_code: order[:postal_code],
                delivery_status: order[:delivery_status]
              }
            end

            status 200
            Oj.dump({
              success: true,
              order: {
                id: order[:order_id],
                reference: order[:reference],
                customer_email: order[:customer_email],
                customer_name: order[:customer_name],
                customer_phone: order[:customer_phone],
                amount_in_cents: order[:amount_in_cents],
                currency: order[:currency],
                status: order[:status],
                wompi_transaction_id: order[:wompi_transaction_id],
                transaction_status: order[:transaction_status],
                items: Oj.load(order[:items], symbol_keys: true),
                shipping_address: shipping_address,
                created_at: order[:created_at],
                updated_at: order[:updated_at]
              }
            }, mode: :compat)
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
        # Poll transaction status from Wompi with retries
        get '/api/checkout/transaction-status/:transaction_id' do
          content_type :json

          transaction_id = params[:transaction_id]

          begin
            update_status_uc = Application::UseCases::UpdateTransactionStatus.new(DB)
            result = update_status_uc.execute(transaction_id)

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
        # Get Wompi acceptance token
        get '/api/checkout/acceptance-token' do
          content_type :json

          acceptance_token = Payment::WompiService.get_acceptance_token

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
        # Webhook endpoint for Wompi payment notifications
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
            unless Payment::WompiService.validate_webhook_signature(payload, signature, timestamp)
              status 401
              return Oj.dump({ error: 'Invalid signature' }, mode: :compat)
            end

            # Parse webhook data
            webhook_data = Oj.load(payload, symbol_keys: true)
            event_type = webhook_data[:event]

            # Only process transaction events
            if event_type == 'transaction.updated'
              update_status_uc = Application::UseCases::UpdateTransactionStatus.new(DB)
              result = update_status_uc.execute_from_webhook(webhook_data[:data])

              if result.success?
                status 200
                return Oj.dump({ success: true }, mode: :compat)
              else
                error = result.failure
                puts "Webhook processing error: #{error[:message]}"

                status 200 # Return 200 to prevent Wompi from retrying
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
