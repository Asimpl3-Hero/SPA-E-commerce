require 'net/http'
require 'uri'
require 'json'
require 'digest'

module Infrastructure
  module Adapters
    module Payment
      class WompiService
        BASE_URL = ENV['WOMPI_ENV'] == 'production' ? ENV['WOMPI_UAT_URL'] : ENV['WOMPI_SANDBOX_URL']
        PRIVATE_KEY = ENV['WOMPI_PRIVATE_KEY']
        PUBLIC_KEY = ENV['WOMPI_PUBLIC_KEY']
        INTEGRITY_KEY = ENV['WOMPI_INTEGRITY_KEY']

        # Create a payment transaction
        def self.create_transaction(params)
          uri = URI("#{BASE_URL}/transactions")

          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = true

          request = Net::HTTP::Post.new(uri)
          request['Authorization'] = "Bearer #{PRIVATE_KEY}"
          request['Content-Type'] = 'application/json'

          # Build payment method data based on type
          payment_method_data = {
            type: params[:payment_method_type]
          }

          if params[:payment_method_type] == 'CARD'
            payment_method_data[:token] = params[:payment_token]
            payment_method_data[:installments] = params[:installments] || 1
          elsif params[:payment_method_type] == 'NEQUI'
            payment_method_data[:phone_number] = params[:nequi_phone_number]
          end

          # Build transaction data
          transaction_data = {
            acceptance_token: params[:acceptance_token],
            amount_in_cents: params[:amount_in_cents],
            currency: params[:currency] || 'COP',
            customer_email: params[:customer_email],
            payment_method: payment_method_data,
            reference: params[:reference],
            customer_data: {
              phone_number: params[:phone_number],
              full_name: params[:full_name]
            },
            shipping_address: params[:shipping_address],
            redirect_url: params[:redirect_url]
          }

          # Add integrity signature
          transaction_data[:signature] = generate_signature(
            params[:reference],
            params[:amount_in_cents],
            params[:currency] || 'COP'
          )

          request.body = transaction_data.to_json

          response = http.request(request)
          parse_response(response)
        end

        # Get acceptance token
        def self.get_acceptance_token
          uri = URI("#{BASE_URL}/merchants/#{PUBLIC_KEY}")

          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = true

          request = Net::HTTP::Get.new(uri)

          response = http.request(request)
          result = parse_response(response)

          result[:data][:data][:presigned_acceptance] if result[:success]
        end

        # Get transaction status
        def self.get_transaction(transaction_id)
          uri = URI("#{BASE_URL}/transactions/#{transaction_id}")

          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = true

          request = Net::HTTP::Get.new(uri)
          request['Authorization'] = "Bearer #{PRIVATE_KEY}"

          response = http.request(request)
          parse_response(response)
        end

        # Validate webhook signature
        def self.validate_webhook_signature(payload, signature, timestamp)
          expected_signature = Digest::SHA256.hexdigest(
            "#{payload}#{timestamp}#{ENV['WOMPI_EVENT_KEY']}"
          )

          expected_signature == signature
        end

        private

        # Generate integrity signature for transaction
        def self.generate_signature(reference, amount_in_cents, currency)
          data = "#{reference}#{amount_in_cents}#{currency}#{INTEGRITY_KEY}"
          Digest::SHA256.hexdigest(data)
        end

        # Parse HTTP response
        def self.parse_response(response)
          body = JSON.parse(response.body, symbolize_names: true)

          if response.code.to_i.between?(200, 299)
            { success: true, data: body }
          else
            {
              success: false,
              error: body[:error] || { type: 'unknown_error', message: 'Unknown error occurred' }
            }
          end
        rescue JSON::ParserError
          {
            success: false,
            error: { type: 'parse_error', message: 'Failed to parse response' }
          }
        end
      end
    end
  end
end
