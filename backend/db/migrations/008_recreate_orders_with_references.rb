Sequel.migration do
  up do
    # Drop the old orders table
    drop_table(:orders)

    # Create new orders table with foreign keys
    create_table(:orders) do
      primary_key :id
      String :reference, null: false, unique: true
      foreign_key :customer_id, :customers, null: false, on_delete: :cascade
      foreign_key :transaction_id, :transactions, null: true, on_delete: :set_null
      foreign_key :delivery_id, :deliveries, null: true, on_delete: :set_null
      Integer :amount_in_cents, null: false
      String :currency, default: 'COP', null: false
      String :status, default: 'pending', null: false # pending, processing, approved, declined, voided, error
      Text :items # JSON with cart items [{product_id, quantity, price_at_purchase}, ...]
      DateTime :created_at
      DateTime :updated_at

      index :reference
      index :customer_id
      index :transaction_id
      index :status
    end
  end

  down do
    drop_table(:orders)

    # Restore old orders table structure
    create_table(:orders) do
      primary_key :id
      String :reference, null: false, unique: true
      String :customer_email, null: false
      String :customer_name, null: false
      String :customer_phone
      Integer :amount_in_cents, null: false
      String :currency, default: 'COP'
      String :status, default: 'pending'
      String :payment_method_type
      String :wompi_transaction_id
      String :wompi_status
      Text :payment_data
      Text :shipping_address
      Text :items
      DateTime :created_at
      DateTime :updated_at

      index :reference
      index :customer_email
      index :wompi_transaction_id
      index :status
    end
  end
end
