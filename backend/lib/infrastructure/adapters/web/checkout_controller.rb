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

            # Generate unique reference
            reference = "ORDER-#{Time.now.to_i}-#{rand(1000..9999)}"

            # Create order in database
            order_id = DB[:orders].insert(
              reference: reference,
              customer_email: order_data[:customer_email],
              customer_name: order_data[:customer_name],
              customer_phone: order_data[:customer_phone],
              amount_in_cents: order_data[:amount_in_cents],
              currency: order_data[:currency] || 'COP',
              status: 'pending',
              shipping_address: Oj.dump(order_data[:shipping_address]),
              items: Oj.dump(order_data[:items]),
              created_at: Time.now,
              updated_at: Time.now
            )

            # If payment method is provided, process payment immediately
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

              # Determine payment method type and prepare params
              payment_type = order_data[:payment_method][:type] || 'CARD'

              # Create transaction with Wompi
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

              result = Payment::WompiService.create_transaction(transaction_params)

              if result[:success]
                transaction_data = result[:data][:data]

                # Update order with payment information
                DB[:orders].where(id: order_id).update(
                  wompi_transaction_id: transaction_data[:id],
                  wompi_status: transaction_data[:status],
                  payment_method_type: 'CARD',
                  payment_data: Oj.dump(transaction_data),
                  status: map_wompi_status(transaction_data[:status]),
                  updated_at: Time.now
                )

                status 201
                return Oj.dump({
                  success: true,
                  order: {
                    id: order_id,
                    reference: reference,
                    amount_in_cents: order_data[:amount_in_cents],
                    currency: order_data[:currency] || 'COP',
                    status: map_wompi_status(transaction_data[:status])
                  },
                  transaction: {
                    id: transaction_data[:id],
                    status: transaction_data[:status]
                  }
                }, mode: :compat)
              else
                # Update order status to error
                DB[:orders].where(id: order_id).update(
                  status: 'error',
                  payment_data: Oj.dump(result[:error]),
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
                currency: order_data[:currency] || 'COP'
              }
            }, mode: :compat)
          rescue Oj::ParseError
            status 400
            Oj.dump({ error: 'Invalid JSON' }, mode: :compat)
          rescue => e
            status 500
            Oj.dump({
              error: 'Failed to create order',
              message: e.message
            }, mode: :compat)
          end
        end

        # POST /api/checkout/process-payment
        post '/api/checkout/process-payment' do
          content_type :json

          begin
            payment_data = Oj.load(request.body.read, symbol_keys: true)

            # Find order by reference
            order = DB[:orders].where(reference: payment_data[:reference]).first

            unless order
              status 404
              return Oj.dump({ error: 'Order not found' }, mode: :compat)
            end

            # Get acceptance token from Wompi
            acceptance_token = Payment::WompiService.get_acceptance_token

            unless acceptance_token
              status 500
              return Oj.dump({ error: 'Failed to get acceptance token' }, mode: :compat)
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
              shipping_address: Oj.load(order[:shipping_address], symbol_keys: true)
            }

            result = Payment::WompiService.create_transaction(transaction_params)

            if result[:success]
              transaction_data = result[:data][:data]

              # Update order with payment information
              DB[:orders].where(id: order[:id]).update(
                wompi_transaction_id: transaction_data[:id],
                wompi_status: transaction_data[:status],
                payment_method_type: payment_data[:payment_method_type],
                payment_data: Oj.dump(transaction_data),
                status: map_wompi_status(transaction_data[:status]),
                updated_at: Time.now
              )

              status 200
              Oj.dump({
                success: true,
                transaction: {
                  id: transaction_data[:id],
                  status: transaction_data[:status],
                  reference: transaction_data[:reference],
                  payment_link_url: transaction_data[:payment_link_url],
                  redirect_url: transaction_data[:redirect_url]
                }
              }, mode: :compat)
            else
              # Update order status to error
              DB[:orders].where(id: order[:id]).update(
                status: 'error',
                payment_data: Oj.dump(result[:error]),
                updated_at: Time.now
              )

              status 400
              Oj.dump({
                success: false,
                error: result[:error]
              }, mode: :compat)
            end
          rescue Oj::ParseError
            status 400
            Oj.dump({ error: 'Invalid JSON' }, mode: :compat)
          rescue => e
            status 500
            Oj.dump({
              error: 'Failed to process payment',
              message: e.message
            }, mode: :compat)
          end
        end

        # GET /api/checkout/order/:reference
        get '/api/checkout/order/:reference' do
          content_type :json

          order = DB[:orders].where(reference: params[:reference]).first

          unless order
            status 404
            return Oj.dump({ error: 'Order not found' }, mode: :compat)
          end

          status 200
          Oj.dump({
            success: true,
            order: {
              id: order[:id],
              reference: order[:reference],
              customer_email: order[:customer_email],
              customer_name: order[:customer_name],
              amount_in_cents: order[:amount_in_cents],
              currency: order[:currency],
              status: order[:status],
              wompi_transaction_id: order[:wompi_transaction_id],
              wompi_status: order[:wompi_status],
              items: Oj.load(order[:items], symbol_keys: true),
              shipping_address: Oj.load(order[:shipping_address], symbol_keys: true),
              created_at: order[:created_at],
              updated_at: order[:updated_at]
            }
          }, mode: :compat)
        rescue => e
          status 500
          Oj.dump({
            error: 'Failed to retrieve order',
            message: e.message
          }, mode: :compat)
        end

        # GET /api/checkout/acceptance-token
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
          else
            'pending'
          end
        end
      end
    end
  end
end
