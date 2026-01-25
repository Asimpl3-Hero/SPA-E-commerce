require_relative '../../config/database'

DB = Config::Database.connection

# Solo ejecutar seeds si la base de datos está vacía
if DB[:categories].count > 0
  puts "Database already seeded. Skipping..."
  exit 0
end

puts "Seeding database..."

# Seed categories
categories = [
  { name: 'Audio', slug: 'audio' },
  { name: 'Portátiles', slug: 'wearables' },
  { name: 'Gaming', slug: 'gaming' },
  { name: 'Cámaras', slug: 'cameras' },
  { name: 'Almacenamiento', slug: 'storage' },
  { name: 'Periféricos', slug: 'peripherals' }
]

categories.each do |cat|
  DB[:categories].insert(
    name: cat[:name],
    slug: cat[:slug],
    created_at: Time.now
  )
end

puts "Created #{categories.size} categories"

# Seed products (prices in COP - Colombian Pesos)
products = [
  {
    name: 'Audífonos Inalámbricos Premium',
    price: 1200000,
    original_price: 1400000,
    rating: 4.8,
    reviews: 2341,
    category: 'Audio',
    description: 'Experimenta calidad de sonido premium con cancelación activa de ruido, 30 horas de batería y comodidad suprema. Incluye EQ adaptativo, audio espacial y cambio fluido entre dispositivos.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    badge_text: 'Más Vendido',
    badge_variant: 'default'
  },
  {
    name: 'Reloj Inteligente Fitness Pro',
    price: 1600000,
    original_price: nil,
    rating: 4.9,
    reviews: 3214,
    category: 'Portátiles',
    description: 'Rastrea tus objetivos de fitness con monitoreo de salud avanzado, GPS, sensor de frecuencia cardíaca, seguimiento del sueño y más de 50 modos de entrenamiento. Resistente al agua hasta 50m.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    badge_text: 'Nuevo',
    badge_variant: 'new'
  },
  {
    name: 'Mouse Gaming Ultra RGB',
    price: 360000,
    original_price: 520000,
    rating: 4.7,
    reviews: 1823,
    category: 'Gaming',
    description: 'Mouse gaming profesional con sensor de 20000 DPI, iluminación RGB personalizable, 11 botones programables y diseño ergonómico para sesiones de juego extendidas.',
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Cámara DSLR Profesional',
    price: 5200000,
    original_price: nil,
    rating: 4.9,
    reviews: 892,
    category: 'Cámaras',
    description: 'Sensor full-frame de 24.2MP, grabación de video 4K, ranuras para tarjetas duales, cuerpo sellado contra clima. Perfecta para fotografía y videografía profesional.',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop',
    badge_text: 'Popular',
    badge_variant: 'info'
  },
  {
    name: 'SSD Portátil 2TB',
    price: 800000,
    original_price: 1000000,
    rating: 4.6,
    reviews: 1456,
    category: 'Almacenamiento',
    description: 'SSD portátil ultra rápido con capacidad de 2TB, interfaz USB 3.2 Gen 2, velocidades de lectura de hasta 1050MB/s. Compacto, duradero y protegido con contraseña.',
    image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Teclado Mecánico RGB',
    price: 640000,
    original_price: nil,
    rating: 4.8,
    reviews: 2103,
    category: 'Periféricos',
    description: 'Teclado mecánico premium con switches Cherry MX, iluminación RGB por tecla, marco de aluminio y teclas macro programables. Disponible en múltiples tipos de switches.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
    badge_text: 'Más Vendido',
    badge_variant: 'default'
  },
  {
    name: 'Audífonos Inalámbricos Pro',
    price: 720000,
    original_price: 920000,
    rating: 4.7,
    reviews: 3891,
    category: 'Audio',
    description: 'Audífonos verdaderamente inalámbricos con cancelación activa de ruido, modo transparencia, 24 horas de batería con estuche de carga y resistencia al agua IPX4.',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
    badge_text: 'Popular',
    badge_variant: 'info'
  },
  {
    name: 'Audífonos Gaming 7.1 Surround',
    price: 520000,
    original_price: nil,
    rating: 4.6,
    reviews: 1567,
    category: 'Gaming',
    description: 'Audífonos gaming envolventes 7.1 con micrófono con cancelación de ruido, almohadillas de espuma viscoelástica e iluminación RGB. Compatible con PC, PS5 y Xbox.',
    image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Rastreador Fitness Inteligente',
    price: 320000,
    original_price: 400000,
    rating: 4.5,
    reviews: 2456,
    category: 'Portátiles',
    description: 'Rastreador fitness asequible con monitoreo de frecuencia cardíaca, seguimiento del sueño, contador de pasos y 7 días de batería. A prueba de agua y compatible con smartphone.',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Cámara de Acción 4K',
    price: 1400000,
    original_price: nil,
    rating: 4.8,
    reviews: 1289,
    category: 'Cámaras',
    description: 'Grabación de video 4K60fps, resistente al agua hasta 10m, estabilización de imagen, pantalla táctil. Perfecta para aventuras y deportes de acción.',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop',
    badge_text: 'Nuevo',
    badge_variant: 'new'
  },
  {
    name: 'Control Gaming Pro',
    price: 280000,
    original_price: 360000,
    rating: 4.7,
    reviews: 2890,
    category: 'Gaming',
    description: 'Control gaming profesional con botones personalizables, gatillos ajustables, agarre texturizado y 40 horas de batería. Funciona con PC y consolas.',
    image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=500&fit=crop',
    badge_text: 'Más Vendido',
    badge_variant: 'default'
  },
  {
    name: 'Hub USB-C 7 en 1',
    price: 200000,
    original_price: nil,
    rating: 4.6,
    reviews: 1678,
    category: 'Periféricos',
    description: 'Hub USB-C 7 en 1 con HDMI 4K, puertos USB 3.0, lector de tarjetas SD/microSD y suministro de energía de 100W. Construcción de aluminio.',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Disco Duro Externo 4TB',
    price: 480000,
    original_price: 600000,
    rating: 4.5,
    reviews: 2134,
    category: 'Almacenamiento',
    description: 'Disco duro externo confiable de 4TB con USB 3.0, software de respaldo automático y protección con contraseña. Ideal para almacenamiento de archivos grandes.',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Monitores de Estudio',
    price: 1800000,
    original_price: nil,
    rating: 4.9,
    reviews: 892,
    category: 'Audio',
    description: 'Monitores de estudio profesionales con respuesta de frecuencia balanceada, woofer de 5 pulgadas y múltiples opciones de entrada. Perfectos para producción musical.',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&h=500&fit=crop',
    badge_text: 'Popular',
    badge_variant: 'info'
  },
  {
    name: 'Cámara Web 1080p HD',
    price: 360000,
    original_price: nil,
    rating: 4.6,
    reviews: 1789,
    category: 'Periféricos',
    description: 'Cámara web Full HD 1080p con enfoque automático, micrófono con reducción de ruido y lente gran angular. Perfecta para videollamadas y streaming.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&h=500&fit=crop',
    badge_text: nil,
    badge_variant: nil
  },
  {
    name: 'Soporte para Smartphone Ajustable',
    price: 100000,
    original_price: 140000,
    rating: 4.7,
    reviews: 3456,
    category: 'Periféricos',
    description: 'Soporte universal ajustable para teléfono con construcción robusta de aluminio, rotación de 360 grados y base antideslizante. Perfecto para escritorio, cocina o mesita de noche.',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
    badge_text: 'Más Vendido',
    badge_variant: 'default'
  },
  {
    name: 'Cargador Inalámbrico 15W',
    price: 160000,
    original_price: nil,
    rating: 4.8,
    reviews: 2145,
    category: 'Periféricos',
    description: 'Cargador inalámbrico rápido de 15W con indicador LED, protección contra sobrecalentamiento y compatibilidad universal. Funciona con todos los dispositivos Qi.',
    image: 'https://images.unsplash.com/photo-1591290619762-c588f8e4d6d3?w=500&h=500&fit=crop',
    badge_text: 'Nuevo',
    badge_variant: 'new'
  },
  {
    name: 'Mochila para Laptop Resistente al Agua',
    price: 240000,
    original_price: 320000,
    rating: 4.9,
    reviews: 4231,
    category: 'Almacenamiento',
    description: 'Mochila premium resistente al agua con compartimento acolchado para laptop (hasta 17"), puerto de carga USB, múltiples bolsillos y diseño ergonómico para traslado diario.',
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
