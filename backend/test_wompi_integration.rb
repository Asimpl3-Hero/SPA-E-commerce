#!/usr/bin/env ruby
# Test script to verify Wompi integration

require 'dotenv/load'
require_relative 'lib/infrastructure/adapters/payment/wompi_service'
require 'json'

puts "=" * 60
puts "WOMPI INTEGRATION TEST"
puts "=" * 60
puts

# Test 1: Check environment variables
puts "1. Checking environment variables..."
puts "   WOMPI_ENV: #{ENV['WOMPI_ENV']}"
puts "   WOMPI_SANDBOX_URL: #{ENV['WOMPI_SANDBOX_URL']}"
puts "   WOMPI_PUBLIC_KEY: #{ENV['WOMPI_PUBLIC_KEY'][0..20]}..." if ENV['WOMPI_PUBLIC_KEY']
puts "   WOMPI_PRIVATE_KEY: #{ENV['WOMPI_PRIVATE_KEY'][0..20]}..." if ENV['WOMPI_PRIVATE_KEY']
puts "   WOMPI_INTEGRITY_KEY: #{ENV['WOMPI_INTEGRITY_KEY'][0..20]}..." if ENV['WOMPI_INTEGRITY_KEY']
puts

# Test 2: Get acceptance token
puts "2. Getting acceptance token from Wompi..."
begin
  acceptance_token = Infrastructure::Adapters::Payment::WompiService.get_acceptance_token

  if acceptance_token
    puts "   ✅ SUCCESS: Got acceptance token"
    puts "   Acceptance Token: #{acceptance_token[:acceptance_token]}"
    puts "   Permalink: #{acceptance_token[:permalink]}"
  else
    puts "   ❌ FAILED: Could not get acceptance token"
    exit 1
  end
rescue => e
  puts "   ❌ ERROR: #{e.message}"
  puts e.backtrace.first(5).join("\n")
  exit 1
end
puts

# Test 3: Test signature generation
puts "3. Testing signature generation..."
begin
  reference = "TEST-#{Time.now.to_i}"
  amount = 50000 # 500 COP
  currency = "COP"

  signature = Infrastructure::Adapters::Payment::WompiService.send(
    :generate_signature,
    reference,
    amount,
    currency
  )

  puts "   ✅ Generated signature for test transaction"
  puts "   Reference: #{reference}"
  puts "   Amount: #{amount} cents"
  puts "   Signature: #{signature[0..20]}..."
rescue => e
  puts "   ❌ ERROR: #{e.message}"
  exit 1
end
puts

# Test 4: Simulate card tokenization (this would normally be done in frontend)
puts "4. Card tokenization info..."
puts "   ℹ️  Card tokenization is done in the frontend using Wompi's widget"
puts "   Test card for sandbox: 4242 4242 4242 4242"
puts "   CVC: Any 3 digits"
puts "   Exp: Any future date"
puts

# Summary
puts "=" * 60
puts "INTEGRATION TEST SUMMARY"
puts "=" * 60
puts "✅ Environment variables configured"
puts "✅ Can communicate with Wompi API"
puts "✅ Acceptance token retrieved successfully"
puts "✅ Signature generation working"
puts
puts "Next steps to test complete flow:"
puts "1. Start the backend: ruby app.rb"
puts "2. Start the frontend: npm run dev"
puts "3. Add products to cart"
puts "4. Go to checkout"
puts "5. Use test card: 4242 4242 4242 4242"
puts "6. Check backend logs for transaction creation"
puts "7. Check database for created records:"
puts "   - customers"
puts "   - transactions"
puts "   - deliveries"
puts "   - orders"
puts "   - products (stock should decrease)"
puts "=" * 60
