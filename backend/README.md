# E-Commerce API Backend

A RESTful API built with Ruby and Sinatra following Hexagonal Architecture (Ports & Adapters) and Railway Oriented Programming principles.

## Architecture

This project implements a **Hexagonal Architecture** with clear separation of concerns:

```
backend/
├── lib/
│   ├── domain/                    # Business logic (entities, value objects)
│   │   ├── entities/              # Domain entities
│   │   │   ├── product.rb
│   │   │   └── category.rb
│   │   └── value_objects/         # Value objects (Result, Money)
│   │       ├── result.rb
│   │       └── money.rb
│   ├── application/               # Application layer
│   │   ├── ports/                 # Interfaces/contracts
│   │   │   ├── product_repository.rb
│   │   │   └── category_repository.rb
│   │   └── use_cases/             # Business use cases (ROP)
│   │       ├── get_all_products.rb
│   │       ├── get_product_by_id.rb
│   │       ├── search_products.rb
│   │       ├── get_all_categories.rb
│   │       ├── create_product.rb
│   │       ├── create_order.rb         # NEW: Order creation
│   │       ├── process_payment.rb      # NEW: Payment processing
│   │       └── update_transaction_status.rb  # NEW: Transaction status updates
│   └── infrastructure/            # External adapters
│       ├── adapters/
│       │   ├── repositories/      # Data persistence implementations
│       │   │   ├── sequel_product_repository.rb
│       │   │   └── sequel_category_repository.rb
│       │   ├── payment/           # Payment gateway adapters
│       │   │   └── wompi_service.rb
│       │   └── web/               # HTTP controllers
│       │       ├── products_controller.rb
│       │       ├── categories_controller.rb
│       │       ├── health_controller.rb
│       │       └── checkout_controller.rb  # NEW: Checkout & payments
│       └── database/
├── config/                        # Configuration files
│   └── database.rb
├── db/
│   ├── migrations/                # Database migrations
│   └── seeds/                     # Seed data
├── app.rb                         # Application entry point
└── config.ru                      # Rack configuration
```

## Architecture Principles

### 1. Hexagonal Architecture (Ports & Adapters)

- **Domain Layer**: Contains pure business logic without external dependencies
- **Application Layer**: Defines ports (interfaces) and use cases
- **Infrastructure Layer**: Implements adapters for external systems (database, web)

### 2. Railway Oriented Programming (ROP)

All use cases return a `Result` monad with two tracks:
- **Success track**: Returns the expected value
- **Failure track**: Returns structured error information

Example:
```ruby
result = get_product_by_id.call(1)

result.match(
  ->(product) { puts "Success: #{product}" },
  ->(error) { puts "Error: #{error[:message]}" }
)
```

### 3. Dependency Injection

Controllers and use cases receive dependencies via constructor injection, making the code testable and maintainable.

## Data Model Design

### Database: PostgreSQL

### Tables

#### `products`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| name | VARCHAR | NOT NULL | Product name |
| price | NUMERIC | NOT NULL | Current selling price |
| original_price | NUMERIC | NULL | Original price (for discounts) |
| rating | FLOAT | DEFAULT 0.0 | Average rating (0-5) |
| reviews | INTEGER | DEFAULT 0 | Number of reviews |
| category | VARCHAR | NOT NULL | Product category |
| description | TEXT | NOT NULL | Product description |
| image | VARCHAR | NOT NULL | Image URL |
| badge_text | VARCHAR | NULL | Badge text (e.g., "Best Seller") |
| badge_variant | VARCHAR | NULL | Badge variant (default, new, info) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_products_category` on `category`
- `idx_products_name` on `name`
- `idx_products_price_category` on `(price, category)`

#### `categories`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| name | VARCHAR | NOT NULL, UNIQUE | Category name |
| slug | VARCHAR | NOT NULL, UNIQUE | URL-friendly identifier |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_categories_slug` on `slug`

### Entity Relationships

```
┌─────────────┐
│  Category   │
│             │
│  - id       │
│  - name     │
│  - slug     │
└─────────────┘
       │
       │ referenced by
       ▼
┌─────────────┐
│   Product   │
│             │
│  - id       │
│  - name     │
│  - price    │
│  - category │ (string reference)
│  - ...      │
└─────────────┘
```

*Note: Currently using string-based category references for simplicity. Can be migrated to foreign keys if needed.*

## API Documentation

### Interactive Documentation (Swagger UI)

Access the interactive API documentation at:
- **Swagger UI**: [http://localhost:4567/api-docs](http://localhost:4567/api-docs)
- **Alternative**: [http://localhost:4567/docs](http://localhost:4567/docs)
- **Swagger JSON**: [http://localhost:4567/swagger.json](http://localhost:4567/swagger.json)

The Swagger UI provides:
- Complete endpoint documentation
- Request/Response schemas
- Try-it-out functionality
- Example values for all parameters

## API Endpoints Summary

### Health Check

#### `GET /api/health`
Check API health status and database connection.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Products

#### `GET /api/products`
Get all products with optional filtering.

**Query Parameters:**
- `category` (string): Filter by category
- `search` or `q` (string): Search in name, description, category
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `sort_by` (string): Sort field (e.g., "price", "name")

**Response:**
```json
[
  {
    "id": 1,
    "name": "Premium Wireless Headphones",
    "price": 299.99,
    "originalPrice": 349.99,
    "rating": 4.8,
    "reviews": 2341,
    "category": "Audio",
    "description": "Experience premium sound quality...",
    "image": "https://...",
    "badge": {
      "text": "Best Seller",
      "variant": "default"
    }
  }
]
```

#### `GET /api/products/:id`
Get a single product by ID.

**Response:**
```json
{
  "id": 1,
  "name": "Premium Wireless Headphones",
  "price": 299.99,
  ...
}
```

**Error Response (404):**
```json
{
  "error": "Product with id 999 not found"
}
```

#### `POST /api/products`
Create a new product (admin functionality).

**Request Body:**
```json
{
  "name": "New Product",
  "price": 99.99,
  "originalPrice": 129.99,
  "category": "Electronics",
  "description": "Product description",
  "image": "https://...",
  "rating": 4.5,
  "reviews": 100,
  "badge_text": "New",
  "badge_variant": "new"
}
```

**Response (201):**
```json
{
  "id": 16,
  "name": "New Product",
  ...
}
```

### Categories

#### `GET /api/categories`
Get all unique product categories.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Audio",
    "slug": "audio"
  }
]
```

### Checkout & Payments (Wompi Integration)

#### `POST /api/checkout/create-order`
Create a new order with customer, delivery, and payment information.

**Request Body:**
```json
{
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "customer_phone": "+573001234567",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 50000
    }
  ],
  "amount_in_cents": 100000,
  "currency": "COP",
  "shipping_address": {
    "address_line_1": "Calle 123 #45-67",
    "city": "Bogotá",
    "region": "Cundinamarca",
    "country": "CO",
    "postal_code": "110111"
  },
  "payment_method": {
    "type": "CARD",
    "token": "tok_test_12345_..."
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "order": {
    "id": 1,
    "reference": "ORDER-1234567890-1234",
    "amount_in_cents": 100000,
    "currency": "COP",
    "status": "approved"
  },
  "transaction": {
    "id": "txn_wompi_123...",
    "status": "APPROVED"
  }
}
```

#### `GET /api/checkout/order/:reference`
Get order details by reference.

**Response (200):**
```json
{
  "success": true,
  "order": {
    "id": 1,
    "reference": "ORDER-1234567890-1234",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "amount_in_cents": 100000,
    "currency": "COP",
    "status": "approved",
    "wompi_transaction_id": "txn_wompi_123...",
    "transaction_status": "APPROVED",
    "items": [...],
    "shipping_address": {...}
  }
}
```

#### `GET /api/checkout/transaction-status/:transaction_id`
Poll transaction status from Wompi (with automatic retries).

**Response (200):**
```json
{
  "success": true,
  "transaction": {
    "id": "txn_wompi_123...",
    "status": "APPROVED",
    "reference": "ORDER-1234567890-1234",
    "amount_in_cents": 100000,
    "currency": "COP"
  },
  "attempts": 3
}
```

#### `POST /api/checkout/webhook`
Webhook endpoint for Wompi payment notifications (with signature validation).

**Headers Required:**
- `X-Signature`: Wompi signature
- `X-Timestamp`: Request timestamp

**Request Body:**
```json
{
  "event": "transaction.updated",
  "data": {
    "transaction": {
      "id": "txn_wompi_123...",
      "status": "APPROVED",
      "reference": "ORDER-1234567890-1234"
    }
  }
}
```

#### `GET /api/checkout/acceptance-token`
Get Wompi acceptance token required for payment processing.

**Response (200):**
```json
{
  "success": true,
  "acceptance_token": {
    "acceptance_token": "eyJhbGc...",
    "permalink": "https://...",
    "type": "END_USER_POLICY"
  }
}
```

## Setup Instructions

### Prerequisites

- Ruby 3.0 or higher
- PostgreSQL 12 or higher
- Bundler

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   bundle install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:
   ```
   DATABASE_URL=postgres://username:password@localhost/ecommerce_dev
   RACK_ENV=development
   PORT=4567
   FRONTEND_URL=http://localhost:5173
   ```

3. **Create database:**
   ```bash
   # Using psql
   createdb ecommerce_dev

   # Or via PostgreSQL client
   psql -U postgres
   CREATE DATABASE ecommerce_dev;
   ```

4. **Run migrations:**
   ```bash
   ruby db/migrate.rb
   ```

5. **Seed database:**
   ```bash
   ruby db/seeds/seed.rb
   ```

### Running the Server

**Development mode with auto-reload:**
```bash
bundle exec rerun 'rackup -p 4567'
```

**Production mode:**
```bash
bundle exec rackup -p 4567
```

The API will be available at `http://localhost:4567`

## Testing

Run tests with RSpec:
```bash
bundle exec rspec
```

## Technology Stack

- **Framework**: Sinatra 4.0
- **Database**: PostgreSQL
- **ORM**: Sequel
- **JSON Parser**: Oj (Optimized JSON)
- **Functional Programming**: dry-monads, dry-validation
- **CORS**: rack-cors
- **Server**: Puma

## Design Patterns Used

1. **Hexagonal Architecture**: Clear separation between domain, application, and infrastructure
2. **Repository Pattern**: Abstract data access through interfaces
3. **Dependency Injection**: Constructor injection for loose coupling
4. **Railway Oriented Programming**: Success/Failure flow using monads
5. **Factory Pattern**: Entity creation in repositories
6. **Strategy Pattern**: Different search/filter strategies in use cases

## Error Handling

All errors are returned in a consistent format:

```json
{
  "error": "Error message",
  "details": {
    "missing": ["field1", "field2"]
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Validation Error
- `404` - Not Found
- `500` - Server Error

## Future Enhancements

- [ ] Authentication & Authorization (JWT)
- [ ] Product reviews and ratings system
- [ ] Order management
- [ ] Shopping cart persistence
- [ ] Payment integration
- [ ] Image upload functionality
- [ ] Admin dashboard
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] Full-text search (Elasticsearch)

## License

MIT
