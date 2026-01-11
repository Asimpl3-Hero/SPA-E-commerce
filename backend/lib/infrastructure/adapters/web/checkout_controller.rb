require 'sinatra/base'
require 'oj'
require_relative '../../../../config/database'
require_relative '../payment/wompi_service'

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

            # Validate required fields
            required_fields = [:customer_email, :customer_name, :items, :amount_in_cents]
            missing_fields = required_fields.select { |field| order_data[field].nil? }

            if missing_fields.any?
              status 400
              return Oj.dump({
                error: 'Missing required fields',
                missing: missing_fields
              }, mode: :compat)
            end

            # Start database transaction for atomicity
            DB.transaction do
              # 1. Create or get customer
              customer = DB[:customers].where(email: order_data[:customer_email]).first

              if customer
                # Update customer info if it changed
                DB[:customers].where(id: customer[:id]).update(
                  full_name: order_data[:customer_name],
                  phone_number: order_data[:customer_phone],
                  updated_at: Time.now
                )
                customer_id = customer[:id]
              else
                # Create new customer
                customer_id = DB[:customers].insert(
                  email: order_data[:customer_email],
                  full_name: order_data[:customer_name],
                  phone_number: order_data[:customer_phone],
                  created_at: Time.now,
                  updated_at: Time.now
                )
              end

              # 2. Create delivery record if shipping address provided
              delivery_id = nil
              if order_data[:shipping_address]
                addr = order_data[:shipping_address]
                delivery_id = DB[:deliveries].insert(
                  address_line_1: addr[:address_line_1] || addr[:address],
                  address_line_2: addr[:address_line_2],
                  city: addr[:city],
                  region: addr[:region] || addr[:state],
                  country: addr[:country] || 'CO',
                  postal_code: addr[:postal_code],
                  phone_number: addr[:phone_number] || order_data[:customer_phone],
                  delivery_notes: addr[:notes],
                  status: 'pending',
                  created_at: Time.now,
                  updated_at: Time.now
                )
              end

              # 3. Generate unique reference
              reference = "ORDER-#{Time.now.to_i}-#{rand(1000..9999)}"

              # 4. Create order (without transaction_id yet, will update after payment)
              order_id = DB[:orders].insert(
                reference: reference,
                customer_id: customer_id,
                delivery_id: delivery_id,
                amount_in_cents: order_data[:amount_in_cents],
                currency: order_data[:currency] || 'COP',
                status: 'pending',
                items: Oj.dump(order_data[:items]),
                created_at: Time.now,
                updated_at: Time.now
              )

              # 5. Process payment if payment method is provided
              if order_data[:payment_method] && (order_data[:payment_method][:token] || order_data[:payment_method][:phone_number])
                # Get acceptance token from Wompi
                acceptance_token = Payment::WompiService.get_acceptance_token

                unless acceptance_token
                  status 500
                  return Oj.dump({
                    success: false,
                    error: 'Failed to get acceptance token'
                  }, mode: :compat)
                end

                # Determine payment method type
                payment_type = order_data[:payment_method][:type] || 'CARD'

                # Prepare transaction params for Wompi
                transaction_params = {
                  acceptance_token: acceptance_token[:acceptance_token],
                  amount_in_cents: order_data[:amount_in_cents],
                  currency: order_data[:currency] || 'COP',
                  customer_email: order_data[:customer_email],
                  full_name: order_data[:customer_name],
                  phone_number: order_data[:customer_phone],
                  payment_method_type: payment_type,
                  reference: reference,
                  redirect_url: "#{request.base_url}/order-confirmation",
                  shipping_address: order_data[:shipping_address]
                }

                # Add payment-specific params
                if payment_type == 'CARD'
                  transaction_params[:payment_token] = order_data[:payment_method][:token]
                elsif payment_type == 'NEQUI'
                  transaction_params[:nequi_phone_number] = order_data[:payment_method][:phone_number]
                end

                # Call Wompi API
                result = Payment::WompiService.create_transaction(transaction_params)

                if result[:success]
                  wompi_data = result[:data][:data]

                  # 6. Create transaction record in our database
                  transaction_id = DB[:transactions].insert(
                    wompi_transaction_id: wompi_data[:id],
                    reference: reference,
                    amount_in_cents: order_data[:amount_in_cents],
                    currency: order_data[:currency] || 'COP',
                    status: wompi_data[:status],
                    payment_method_type: payment_type,
                    payment_method_token: payment_type == 'CARD' ? order_data[:payment_method][:token] : nil,
                    payment_data: Oj.dump(wompi_data),
                    created_at: Time.now,
                    updated_at: Time.now
                  )

                  # 7. Update order with transaction reference
                  order_status = map_wompi_status(wompi_data[:status])
                  DB[:orders].where(id: order_id).update(
                    transaction_id: transaction_id,
                    status: order_status,
                    updated_at: Time.now
                  )

                  # 8. If payment approved, update stock
                  if wompi_data[:status] == 'APPROVED'
                    update_product_stock(order_data[:items], :decrement)

                    # Update delivery status
                    if delivery_id
                      DB[:deliveries].where(id: delivery_id).update(
                        status: 'assigned',
                        estimated_delivery_date: Time.now + (3 * 24 * 60 * 60), # 3 days from now
                        updated_at: Time.now
                      )
                    end
                  end

                  status 201
                  return Oj.dump({
                    success: true,
                    order: {
                      id: order_id,
                      reference: reference,
                      amount_in_cents: order_data[:amount_in_cents],
                      currency: order_data[:currency] || 'COP',
                      status: order_status
                    },
                    transaction: {
                      id: wompi_data[:id],
                      status: wompi_data[:status]
                    }
                  }, mode: :compat)
                else
                  # Payment failed - create failed transaction record
                  transaction_id = DB[:transactions].insert(
                    reference: reference,
                    amount_in_cents: order_data[:amount_in_cents],
                    currency: order_data[:currency] || 'COP',
                    status: 'ERROR',
                    payment_method_type: payment_type,
                    payment_data: Oj.dump(result[:error]),
                    created_at: Time.now,
                    updated_at: Time.now
                  )

                  # Update order status to error
                  DB[:orders].where(id: order_id).update(
                    transaction_id: transaction_id,
                    status: 'error',
                    updated_at: Time.now
                  )

                  status 400
                  return Oj.dump({
                    success: false,
                    error: result[:error]
                  }, mode: :compat)
                end
              end

              # Return order without payment processing
              status 201
              Oj.dump({
                success: true,
                order: {
                  id: order_id,
                  reference: reference,
                  amount_in_cents: order_data[:amount_in_cents],
                  currency: order_data[:currency] || 'COP',
                  status: 'pending'
                }
              }, mode: :compat)
            end # DB.transaction
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
          max_attempts = 5
          delay_seconds = 3
          final_statuses = ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']

          begin
            max_attempts.times do |attempt|
              # Get transaction status from Wompi
              result = Payment::WompiService.get_transaction(transaction_id)

              if result[:success]
                wompi_data = result[:data][:data]
                current_status = wompi_data[:status]

                # Update our database with the latest status
                DB.transaction do
                  transaction_record = DB[:transactions]
                    .where(wompi_transaction_id: transaction_id)
                    .first

                  if transaction_record
                    # Update transaction
                    DB[:transactions].where(id: transaction_record[:id]).update(
                      status: current_status,
                      payment_data: Oj.dump(wompi_data),
                      updated_at: Time.now
                    )

                    # Update order
                    order_status = map_wompi_status(current_status)
                    order = DB[:orders].where(transaction_id: transaction_record[:id]).first

                    if order
                      DB[:orders].where(id: order[:id]).update(
                        status: order_status,
                        updated_at: Time.now
                      )

                      # Update stock if approved
                      if current_status == 'APPROVED' && transaction_record[:status] != 'APPROVED'
                        items = Oj.load(order[:items], symbol_keys: true)
                        update_product_stock(items, :decrement)

                        # Update delivery
                        if order[:delivery_id]
                          DB[:deliveries].where(id: order[:delivery_id]).update(
                            status: 'assigned',
                            estimated_delivery_date: Time.now + (3 * 24 * 60 * 60),
                            updated_at: Time.now
                          )
                        end
                      end
                    end
                  end
                end

                # If status is final, return immediately
                if final_statuses.include?(current_status)
                  status 200
                  return Oj.dump({
                    success: true,
                    transaction: {
                      id: wompi_data[:id],
                      status: current_status,
                      reference: wompi_data[:reference],
                      amount_in_cents: wompi_data[:amount_in_cents],
                      currency: wompi_data[:currency],
                      payment_method_type: wompi_data[:payment_method_type],
                      status_message: wompi_data[:status_message]
                    },
                    attempts: attempt + 1
                  }, mode: :compat)
                end

                # Status is still PENDING, wait before next attempt
                sleep(delay_seconds) unless attempt == max_attempts - 1
              else
                # Error getting transaction
                status 500
                return Oj.dump({
                  success: false,
                  error: result[:error],
                  attempts: attempt + 1
                }, mode: :compat)
              end
            end

            # Max attempts reached and status still PENDING
            status 200
            Oj.dump({
              success: true,
              transaction: {
                status: 'PENDING',
                message: 'Transaction is still being processed'
              },
              attempts: max_attempts
            }, mode: :compat)
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
            transaction_data = webhook_data[:data][:transaction]

            # Only process transaction events
            if event_type == 'transaction.updated'
              DB.transaction do
                # Find transaction by Wompi transaction ID
                transaction = DB[:transactions]
                  .where(wompi_transaction_id: transaction_data[:id])
                  .first

                if transaction
                  # Update transaction status
                  DB[:transactions].where(id: transaction[:id]).update(
                    status: transaction_data[:status],
                    payment_data: Oj.dump(transaction_data),
                    updated_at: Time.now
                  )

                  # Update related order
                  order_status = map_wompi_status(transaction_data[:status])
                  order = DB[:orders].where(transaction_id: transaction[:id]).first

                  if order
                    DB[:orders].where(id: order[:id]).update(
                      status: order_status,
                      updated_at: Time.now
                    )

                    # Update stock if newly approved
                    if transaction_data[:status] == 'APPROVED' && transaction[:status] != 'APPROVED'
                      items = Oj.load(order[:items], symbol_keys: true)
                      update_product_stock(items, :decrement)

                      # Update delivery
                      if order[:delivery_id]
                        DB[:deliveries].where(id: order[:delivery_id]).update(
                          status: 'assigned',
                          estimated_delivery_date: Time.now + (3 * 24 * 60 * 60),
                          updated_at: Time.now
                        )
                      end
                    end
                  end
                end
              end

              status 200
              Oj.dump({ success: true }, mode: :compat)
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

        private

        # Map Wompi status to our internal status
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

        # Update product stock (increment or decrement)
        def update_product_stock(items, operation)
          items.each do |item|
            product_id = item[:product_id]
            quantity = item[:quantity]

            product = DB[:products].where(id: product_id).first
            next unless product

            if operation == :decrement
              # Decrease stock
              new_stock = [product[:stock] - quantity, 0].max
              DB[:products].where(id: product_id).update(
                stock: new_stock,
                updated_at: Time.now
              )
            elsif operation == :increment
              # Increase stock (for refunds/cancellations)
              new_stock = product[:stock] + quantity
              DB[:products].where(id: product_id).update(
                stock: new_stock,
                updated_at: Time.now
              )
            end
          end
        end
      end
    end
  end
end
