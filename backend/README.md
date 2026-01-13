# 💎 Backend API - E-Commerce

![Ruby](https://img.shields.io/badge/Ruby-3.x-CC342D?style=for-the-badge&logo=ruby&logoColor=white)
![Sinatra](https://img.shields.io/badge/Sinatra-4.0-000000?style=for-the-badge&logo=sinatra&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Sequel](https://img.shields.io/badge/Sequel-ORM-green?style=for-the-badge)
![Wompi](https://img.shields.io/badge/Wompi-Payment-FF6B6B?style=for-the-badge)
![RSpec](https://img.shields.io/badge/RSpec-Testing-red?style=for-the-badge)

**API REST con Ruby + Sinatra + PostgreSQL + Wompi**

Implementa **Arquitectura Hexagonal** y **Railway Oriented Programming** para gestionar productos, órdenes y pagos.

---

## 🌐 Producción

**API en vivo:** [https://api-techvault.ondeploy.store/swagger-ui.html](https://api-techvault.ondeploy.store/swagger-ui.html)

Accede a la documentación interactiva de Swagger para explorar y probar todos los endpoints disponibles.

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
bundle install

# 2. Crear base de datos
createdb ecommerce_dev

# 3. Ejecutar migraciones
ruby db/migrate.rb

# 4. Cargar datos de prueba
ruby db/seeds/seed.rb

# 5. Iniciar servidor (con auto-reload)
bundle exec rerun 'rackup -p 4567'
```

✅ **API lista en:** `http://localhost:4567`
📖 **Swagger UI:** `http://localhost:4567/api-docs`

---

## 🏛️ Arquitectura

### **3 Capas (Hexagonal)**

```
┌─────────────────────────────┐
│  INFRASTRUCTURE             │  ← Web, DB, Wompi
│  ┌───────────────────────┐  │
│  │  APPLICATION          │  │  ← Use Cases
│  │  ┌─────────────────┐  │  │
│  │  │  DOMAIN         │  │  │  ← Lógica pura
│  │  │  Product, Order │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Beneficios:**
- ✅ Testeable (sin dependencias externas)
- ✅ Flexible (fácil cambiar DB/framework)
- ✅ Mantenible (cambios localizados)

---

## 🔄 Railway Oriented Programming

Todos los Use Cases retornan **Success** o **Failure**:

```ruby
# ✅ Éxito
result = get_product_by_id.call(1)
# => Success({ id: 1, name: "Product" })

# ❌ Error
result = get_product_by_id.call(999)
# => Failure({ message: "Not found", code: :not_found })

# Uso con match
result.match(
  ->(product) { json product },        # 200 OK
  ->(error) { halt 404, json(error) }  # 404 Error
)
```

---

## 💳 Flujo de Pago

```
POST /api/orders/checkout
    ↓
1. CreateOrder Use Case
   • Valida datos
   • Calcula totales
   • Crea orden en DB
    ↓
2. ProcessPayment Use Case
   • Llama WompiService
   • POST Wompi /transactions
   • Guarda transaction_id
    ↓
3. Frontend hace polling
   GET /api/transactions/:id/status
    ↓
4. Wompi responde:
   • APPROVED ✅
   • DECLINED ❌
   • PENDING ⏳
   • ERROR ⚠️
    ↓
5. Backend actualiza orden
```

---

## 🌐 API Endpoints

### **Productos**
```bash
GET  /api/products              # Lista todos
GET  /api/products/:id          # Uno por ID
GET  /api/products?category=x   # Filtrar
GET  /api/products?search=x     # Buscar
POST /api/products              # Crear (admin)
```

### **Checkout**
```bash
POST /api/orders/checkout       # Crear orden y pagar
GET  /api/orders/:reference     # Ver orden
GET  /api/transactions/:id/status  # Estado de pago
POST /api/webhook               # Webhook Wompi
```

### **Otros**
```bash
GET /api/categories             # Categorías
GET /api/health                 # Health check
GET /api/acceptance-token       # Token Wompi
```

---

## 📊 Modelo de Datos

### **products**
```sql
id, name, price, category, description,
image, rating, reviews, created_at
```

### **orders**
```sql
id, reference, customer_email, customer_name,
amount_in_cents, status, wompi_transaction_id,
items (JSONB), shipping_address (JSONB)
```

### **categories**
```sql
id, name, slug
```

---

## ⚙️ Variables de Entorno

```env
# Database
DATABASE_URL=postgres://user:password@localhost/ecommerce_dev

# Server
PORT=4567
RACK_ENV=development
FRONTEND_URL=http://localhost:5173

# Wompi (obtener en comercios.wompi.co)
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=test_events_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
```

---

## 📁 Estructura

```
backend/
├── lib/
│   ├── domain/              # Entidades (Product, Order)
│   ├── application/
│   │   ├── ports/          # Interfaces
│   │   └── use_cases/      # GetProducts, CreateOrder, ProcessPayment
│   └── infrastructure/
│       ├── repositories/   # PostgreSQL
│       ├── payment/        # WompiService
│       └── web/            # Controllers
├── db/
│   ├── migrations/         # Esquema DB
│   └── seeds/              # Datos de prueba
└── spec/                   # Tests RSpec
```

---

## 🧪 Testing

```bash
bundle exec rspec                    # Todos los tests
bundle exec rspec --format doc       # Con detalles
```

**Cobertura:** ~90% (use cases, repositories, controllers)

---

## 🔐 Seguridad

- ✅ Validación de firma HMAC en webhooks
- ✅ CORS configurado solo para frontend
- ✅ Variables de entorno (nunca en código)
- ✅ Tokenización de tarjetas (frontend → Wompi)

---

## 🐛 Debugging

```ruby
# Ver query SQL
DB.loggers << Logger.new($stdout)

# Inspeccionar resultado
result = use_case.call(params)
puts result.inspect

# Consola interactiva
irb -r ./app.rb
Product.all
```

---

## 🎯 Use Cases Principales

| Use Case | Función |
|----------|---------|
| `GetAllProducts` | Lista productos con filtros |
| `GetProductById` | Obtiene un producto |
| `CreateOrder` | Crea orden con validación |
| `ProcessPayment` | Procesa pago con Wompi |
| `UpdateTransactionStatus` | Actualiza estado desde webhook |

---

## 📖 Documentación API

Abre **Swagger UI** en `http://localhost:4567/api-docs` para:
- 📋 Ver todos los endpoints
- 🧪 Probar requests
- 📝 Ejemplos de uso
- 🔍 Esquemas de datos

---

## 🤝 Contribuir

1. Escribe tests
2. Sigue arquitectura hexagonal
3. Usa Railway Oriented en use cases
4. Documenta en Swagger
5. `bundle exec rspec` antes de commit

---

**Stack:** Ruby 3.x + Sinatra 4.0 + PostgreSQL 12+ + Sequel + Wompi

<div align="center">
  <sub>Built with 💎 Ruby + 🏛️ Clean Architecture</sub>
</div>
