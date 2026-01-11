# Database Model Design

## Overview
This e-commerce application uses PostgreSQL with a normalized relational database design following best practices. The database is structured to support the complete checkout flow with Wompi payment integration.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  customers  │         │    orders    │         │transactions  │
├─────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)     │◄───┐    │ id (PK)      │    ┌───►│ id (PK)      │
│ email       │    │    │ reference    │    │    │ wompi_tx_id  │
│ full_name   │    └────│ customer_id  │    │    │ reference    │
│ phone_number│         │ transaction* ├────┘    │ amount       │
│ created_at  │         │ delivery_id* │         │ status       │
│ updated_at  │         │ amount       │         │ payment_data │
└─────────────┘         │ currency     │         │ created_at   │
                        │ status       │         │ updated_at   │
                        │ items (JSON) │         └──────────────┘
                        │ created_at   │
                        │ updated_at   │
                        └──────┬───────┘
                               │
                               │
                        ┌──────▼───────┐
                        │  deliveries  │
                        ├──────────────┤
                        │ id (PK)      │
                        │ address_line1│
                        │ address_line2│
                        │ city         │
                        │ region       │
                        │ country      │
                        │ postal_code  │
                        │ phone_number │
                        │ status       │
                        │ created_at   │
                        │ updated_at   │
                        └──────────────┘

┌─────────────┐         ┌──────────────┐
│ categories  │         │   products   │
├─────────────┤         ├──────────────┤
│ id (PK)     │         │ id (PK)      │
│ name        │         │ name         │
│ slug        │         │ price        │
│ created_at  │         │ category     │
└─────────────┘         │ description  │
                        │ image        │
                        │ stock        │◄── Updated on purchase
                        │ created_at   │
                        │ updated_at   │
                        └──────────────┘
```

## Tables

### 1. **customers**
Stores customer information.

| Column       | Type      | Constraints           | Description                    |
|--------------|-----------|----------------------|--------------------------------|
| id           | INTEGER   | PRIMARY KEY          | Auto-increment ID              |
| email        | TEXT      | NOT NULL, UNIQUE     | Customer email (unique)        |
| full_name    | TEXT      | NOT NULL             | Customer full name             |
| phone_number | TEXT      |                      | Contact phone number           |
| created_at   | TIMESTAMP |                      | Record creation timestamp      |
| updated_at   | TIMESTAMP |                      | Last update timestamp          |

**Indexes**: `email`

---

### 2. **transactions**
Stores Wompi payment transaction details.

| Column              | Type      | Constraints           | Description                           |
|---------------------|-----------|----------------------|---------------------------------------|
| id                  | INTEGER   | PRIMARY KEY          | Auto-increment ID                     |
| wompi_transaction_id| TEXT      | UNIQUE               | Wompi's transaction ID                |
| reference           | TEXT      | NOT NULL             | Our internal reference                |
| amount_in_cents     | INTEGER   | NOT NULL             | Amount in cents (COP)                 |
| currency            | TEXT      | NOT NULL, DEFAULT 'COP' | Currency code                      |
| status              | TEXT      | NOT NULL, DEFAULT 'PENDING' | Transaction status             |
| payment_method_type | TEXT      |                      | CARD, NEQUI, etc.                     |
| payment_method_token| TEXT      |                      | Tokenized payment method              |
| payment_data        | TEXT      |                      | Full Wompi response (JSON)            |
| signature           | TEXT      |                      | Integrity signature                   |
| created_at          | TIMESTAMP |                      | Record creation timestamp             |
| updated_at          | TIMESTAMP |                      | Last update timestamp                 |

**Status values**: `PENDING`, `APPROVED`, `DECLINED`, `VOIDED`, `ERROR`

**Indexes**: `wompi_transaction_id`, `reference`, `status`

---

### 3. **deliveries**
Stores delivery/shipping information.

| Column                 | Type      | Constraints              | Description                    |
|------------------------|-----------|-------------------------|--------------------------------|
| id                     | INTEGER   | PRIMARY KEY             | Auto-increment ID              |
| address_line_1         | TEXT      | NOT NULL                | Primary address line           |
| address_line_2         | TEXT      |                         | Secondary address line         |
| city                   | TEXT      | NOT NULL                | City name                      |
| region                 | TEXT      |                         | State/Department               |
| country                | TEXT      | NOT NULL, DEFAULT 'CO'  | Country code                   |
| postal_code            | TEXT      |                         | Postal/ZIP code                |
| phone_number           | TEXT      |                         | Delivery contact phone         |
| delivery_notes         | TEXT      |                         | Special delivery instructions  |
| status                 | TEXT      | DEFAULT 'pending'       | Delivery status                |
| estimated_delivery_date| TIMESTAMP |                         | Expected delivery date         |
| actual_delivery_date   | TIMESTAMP |                         | Actual delivery date           |
| created_at             | TIMESTAMP |                         | Record creation timestamp      |
| updated_at             | TIMESTAMP |                         | Last update timestamp          |

**Status values**: `pending`, `assigned`, `in_transit`, `delivered`, `failed`

**Indexes**: `status`

---

### 4. **orders**
Central table linking customers, transactions, and deliveries.

| Column         | Type      | Constraints                      | Description                        |
|----------------|-----------|----------------------------------|-----------------------------------|
| id             | INTEGER   | PRIMARY KEY                      | Auto-increment ID                 |
| reference      | TEXT      | NOT NULL, UNIQUE                 | Unique order reference            |
| customer_id    | INTEGER   | NOT NULL, FK → customers(id)     | Customer who placed the order     |
| transaction_id | INTEGER   | FK → transactions(id)            | Associated payment transaction    |
| delivery_id    | INTEGER   | FK → deliveries(id)              | Associated delivery info          |
| amount_in_cents| INTEGER   | NOT NULL                         | Total order amount in cents       |
| currency       | TEXT      | NOT NULL, DEFAULT 'COP'          | Currency code                     |
| status         | TEXT      | NOT NULL, DEFAULT 'pending'      | Order status                      |
| items          | TEXT      |                                  | Cart items (JSON array)           |
| created_at     | TIMESTAMP |                                  | Record creation timestamp         |
| updated_at     | TIMESTAMP |                                  | Last update timestamp             |

**Status values**: `pending`, `processing`, `approved`, `declined`, `voided`, `error`

**Foreign Keys**:
- `customer_id` → `customers(id)` ON DELETE CASCADE
- `transaction_id` → `transactions(id)` ON DELETE SET NULL
- `delivery_id` → `deliveries(id)` ON DELETE SET NULL

**Items JSON structure**:
```json
[
  {
    "product_id": 1,
    "name": "Product Name",
    "quantity": 2,
    "price_at_purchase": 29999
  }
]
```

**Indexes**: `reference`, `customer_id`, `transaction_id`, `status`

---

### 5. **products**
Product catalog with stock management.

| Column         | Type      | Constraints              | Description                    |
|----------------|-----------|-------------------------|--------------------------------|
| id             | INTEGER   | PRIMARY KEY             | Auto-increment ID              |
| name           | TEXT      | NOT NULL                | Product name                   |
| price          | NUMERIC   | NOT NULL                | Current price                  |
| original_price | NUMERIC   |                         | Original price (for discounts) |
| rating         | FLOAT     | DEFAULT 0.0             | Average rating                 |
| reviews        | INTEGER   | DEFAULT 0               | Number of reviews              |
| category       | TEXT      | NOT NULL                | Product category               |
| description    | TEXT      | NOT NULL                | Product description            |
| image          | TEXT      | NOT NULL                | Product image URL              |
| badge_text     | TEXT      |                         | Badge text (optional)          |
| badge_variant  | TEXT      |                         | Badge color variant            |
| **stock**      | INTEGER   | NOT NULL, DEFAULT 0     | **Available stock units**      |
| created_at     | TIMESTAMP |                         | Record creation timestamp      |
| updated_at     | TIMESTAMP |                         | Last update timestamp          |

**Indexes**: `category`, `name`, `(price, category)`

---

### 6. **categories**
Product categories.

| Column     | Type      | Constraints           | Description               |
|------------|-----------|-----------------------|---------------------------|
| id         | INTEGER   | PRIMARY KEY           | Auto-increment ID         |
| name       | TEXT      | NOT NULL, UNIQUE      | Category name             |
| slug       | TEXT      | NOT NULL, UNIQUE      | URL-friendly slug         |
| created_at | TIMESTAMP |                       | Record creation timestamp |

**Indexes**: `slug`

---

## Business Flow

### Purchase Flow with Wompi Integration

1. **Customer Browses Products**
   - Frontend fetches products from `products` table
   - Displays available stock

2. **Customer Initiates Checkout**
   - Customer data is created/retrieved in `customers` table
   - Delivery info is created in `deliveries` table
   - Order is created in `orders` table with status `pending`

3. **Payment Processing**
   - Transaction record created in `transactions` table with status `PENDING`
   - Wompi API is called with payment details
   - Transaction is updated with Wompi response

4. **Payment Success**
   - Transaction status → `APPROVED`
   - Order status → `approved`
   - **Product stock is decremented**
   - Customer receives confirmation

5. **Payment Failure**
   - Transaction status → `DECLINED` or `ERROR`
   - Order status → `declined` or `error`
   - Stock remains unchanged

---

## Key Features

✅ **Normalized Design**: Eliminates data redundancy
✅ **Foreign Keys**: Maintains referential integrity
✅ **Stock Management**: Products have stock field that's updated on purchase
✅ **Transaction Tracking**: Separate table for Wompi transactions
✅ **Customer Management**: Centralized customer records
✅ **Delivery Tracking**: Dedicated delivery information and status
✅ **Indexed Queries**: Optimized for common queries (email, reference, status)
✅ **Audit Trail**: created_at and updated_at on all tables

---

## Migration Files

1. `001_create_categories.rb` - Creates categories table
2. `002_create_products.rb` - Creates products table
3. `003_create_orders.rb` - Creates initial orders table (deprecated)
4. `004_add_stock_to_products.rb` - Adds stock column to products
5. `005_create_customers.rb` - Creates customers table
6. `006_create_transactions.rb` - Creates transactions table
7. `007_create_deliveries.rb` - Creates deliveries table
8. `008_recreate_orders_with_references.rb` - Recreates orders with proper foreign keys

---

## Compliance with Wompi Requirements

✅ **stock** - Products table has stock field
✅ **transactions** - Dedicated transactions table for Wompi payments
✅ **customers** - Separate customers table
✅ **deliveries** - Separate deliveries table
✅ All tables support different types of requests (GET, POST, PUT, DELETE)
