require_relative '../../config/database'

DB = Config::Database.connection

# Clear existing data (in order to respect foreign keys)
DB[:orders].delete if DB.table_exists?(:orders)
DB[:deliveries].delete if DB.table_exists?(:deliveries)
DB[:transactions].delete if DB.table_exists?(:transactions)
DB[:customers].delete if DB.table_exists?(:customers)
DB[:products].delete
DB[:categories].delete

puts "Seeding database..."

# Seed categories
categories = [
  { name: 'Audio', slug: 'audio' },
  { name: 'Wearables', slug: 'wearables' },
  { name: 'Gaming', slug: 'gaming' },
  { name: 'Cameras', slug: 'cameras' },
  { name: 'Storage', slug: 'storage' },
  { name: 'Peripherals', slug: 'peripherals' }
]

categories.each do |cat|
  DB[:categories].insert(
    name: cat[:name],
    slug: cat[:slug],
    created_at: Time.now
  )
end

puts "Created #{categories.size} categories"

# Seed products
products = [
  {
    name: 'Premium Wireless Headphones',
    price: 299.99,
    original_price: 349.99,
    rating: 4.8,
    reviews: 2341,
    category: 'Audio',
    description: 'Experience premium sound quality with active noise cancellation, 30-hour battery life, and supreme comfort. Features adaptive EQ, spatial audio, and seamless device switching.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    badge_text: 'Best Seller',
    badge_variant: 'default'
  },
  {
    name: 'Smart Fitness Watch Pro',
    price: 399.00,
    original_price: nil,
    rating: 4.9,
    reviews: 3214,
    category: 'Wearables',
    description: 'Track your fitness goals with advanced health monitoring, GPS, heart rate sensor, sleep tracking, and 50+ workout modes. Water resistant up to 50m.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    badge_text: 'New',
    badge_variant: 'new'
  },
  {
    name: 'Ultra Gaming Mouse RGB',
    price: 89.99,
    original_price: 129.99,
    rating: 4.7,
    reviews: 1823,
    category: 'Gaming',
    description: 'Professional gaming mouse with 20000 DPI sensor, customizable RGB lighting, 11 programmable buttons, and ergonomic design for extended gaming sessions.',
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Professional DSLR Camera',
    price: 1299.00,
    original_price: nil,
    rating: 4.9,
    reviews: 892,
    category: 'Cameras',
    description: '24.2MP full-frame sensor, 4K video recording, dual card slots, weather-sealed body. Perfect for professional photography and videography.',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop',
    badge_text: 'Popular',
    badge_variant: 'info'
  },
  {
    name: 'Portable SSD 2TB',
    price: 199.99,
    original_price: 249.99,
    rating: 4.6,
    reviews: 1456,
    category: 'Storage',
    description: 'Ultra-fast portable SSD with 2TB capacity, USB 3.2 Gen 2 interface, read speeds up to 1050MB/s. Compact, durable, and password protected.',
    image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Mechanical Keyboard RGB',
    price: 159.99,
    original_price: nil,
    rating: 4.8,
    reviews: 2103,
    category: 'Peripherals',
    description: 'Premium mechanical keyboard with Cherry MX switches, per-key RGB lighting, aluminum frame, and programmable macro keys. Available in multiple switch types.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
    badge_text: 'Best Seller',
    badge_variant: 'default'
  },
  {
    name: 'Wireless Earbuds Pro',
    price: 179.99,
    original_price: 229.99,
    rating: 4.7,
    reviews: 3891,
    category: 'Audio',
    description: 'True wireless earbuds with active noise cancellation, transparency mode, 24-hour battery life with charging case, and IPX4 water resistance.',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
    badge_text: 'Popular',
    badge_variant: 'info'
  },
  {
    name: 'Gaming Headset 7.1 Surround',
    price: 129.99,
    original_price: nil,
    rating: 4.6,
    reviews: 1567,
    category: 'Gaming',
    description: 'Immersive 7.1 surround sound gaming headset with noise-canceling microphone, memory foam ear cushions, and RGB lighting. Compatible with PC, PS5, and Xbox.',
    image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Smart Fitness Tracker',
    price: 79.99,
    original_price: 99.99,
    rating: 4.5,
    reviews: 2456,
    category: 'Wearables',
    description: 'Affordable fitness tracker with heart rate monitoring, sleep tracking, step counter, and 7-day battery life. Waterproof and smartphone compatible.',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Action Camera 4K',
    price: 349.99,
    original_price: nil,
    rating: 4.8,
    reviews: 1289,
    category: 'Cameras',
    description: '4K60fps video recording, waterproof up to 33ft, image stabilization, touch screen display. Perfect for adventure and action sports.',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop',
    badge_text: 'New',
    badge_variant: 'new'
  },
  {
    name: 'Gaming Controller Pro',
    price: 69.99,
    original_price: 89.99,
    rating: 4.7,
    reviews: 2890,
    category: 'Gaming',
    description: 'Professional gaming controller with customizable buttons, hair-trigger locks, textured grip, and 40-hour battery life. Works with PC and consoles.',
    image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=500&fit=crop',
    badge_text: 'Best Seller',
    badge_variant: 'default'
  },
  {
    name: 'USB-C Hub 7-in-1',
    price: 49.99,
    original_price: nil,
    rating: 4.6,
    reviews: 1678,
    category: 'Peripherals',
    description: '7-in-1 USB-C hub with HDMI 4K, USB 3.0 ports, SD/microSD card reader, and 100W power delivery. Aluminum construction.',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'External HDD 4TB',
    price: 119.99,
    original_price: 149.99,
    rating: 4.5,
    reviews: 2134,
    category: 'Storage',
    description: 'Reliable 4TB external hard drive with USB 3.0, automatic backup software, and password protection. Ideal for large file storage.',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Studio Monitor Speakers',
    price: 449.99,
    original_price: nil,
    rating: 4.9,
    reviews: 892,
    category: 'Audio',
    description: 'Professional studio monitor speakers with balanced frequency response, 5-inch woofer, and multiple input options. Perfect for music production.',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&h=500&fit=crop',
    badge_text: 'Popular',
    badge_variant: 'info'
  },
  {
    name: 'Webcam 1080p HD',
    price: 89.99,
    original_price: nil,
    rating: 4.6,
    reviews: 1789,
    category: 'Peripherals',
    description: 'Full HD 1080p webcam with autofocus, noise-reducing microphone, and wide-angle lens. Perfect for video calls and streaming.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Smartphone Stand Adjustable',
    price: 24.99,
    original_price: 34.99,
    rating: 4.7,
    reviews: 3456,
    category: 'Peripherals',
    description: 'Universal adjustable phone stand with sturdy aluminum construction, 360-degree rotation, and non-slip base. Perfect for desk, kitchen, or bedside use.',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
    badge_text: 'Best Seller',
    badge_variant: 'default'
  },
  {
    name: 'Wireless Charging Pad 15W',
    price: 39.99,
    original_price: nil,
    rating: 4.8,
    reviews: 2145,
    category: 'Peripherals',
    description: 'Fast 15W wireless charging pad with LED indicator, overheat protection, and universal compatibility. Works with all Qi-enabled devices.',
    image: 'https://images.unsplash.com/photo-1591290619762-c588f8e4d6d3?w=500&h=500&fit=crop',
    badge_text: 'New',
    badge_variant: 'new'
  },
  {
    name: 'Laptop Backpack Water-Resistant',
    price: 59.99,
    original_price: 79.99,
    rating: 4.9,
    reviews: 4231,
    category: 'Storage',
    description: 'Premium water-resistant backpack with padded laptop compartment (up to 17"), USB charging port, multiple pockets, and ergonomic design for daily commute.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    badge_text: 'Popular',
    badge_variant: 'info'
  }
]

products.each do |product|
  DB[:products].insert(
    name: product[:name],
    price: product[:price],
    original_price: product[:original_price],
    rating: product[:rating],
    reviews: product[:reviews],
    category: product[:category],
    description: product[:description],
    image: product[:image],
    badge_text: product[:badge_text],
    badge_variant: product[:badge_variant],
    stock: rand(5..50), # Random stock between 5 and 50 units
    created_at: Time.now,
    updated_at: Time.now
  )
end

puts "Created #{products.size} products"

# Seed sample customers
sample_customers = [
  { email: 'john.doe@example.com', full_name: 'John Doe', phone_number: '+573001234567' },
  { email: 'jane.smith@example.com', full_name: 'Jane Smith', phone_number: '+573007654321' },
  { email: 'carlos.garcia@example.com', full_name: 'Carlos García', phone_number: '+573009876543' }
]

sample_customers.each do |customer|
  DB[:customers].insert(
    email: customer[:email],
    full_name: customer[:full_name],
    phone_number: customer[:phone_number],
    created_at: Time.now,
    updated_at: Time.now
  )
end

puts "Created #{sample_customers.size} sample customers"
puts "Seeding completed successfully!"
