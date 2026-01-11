Sequel.migration do
  up do
    create_table(:orders) do
      primary_key :id
      String :reference, null: false, unique: true
      String :customer_email, null: false
      String :customer_name, null: false
      String :customer_phone
      Integer :amount_in_cents, null: false
      String :currency, default: 'COP'
      String :status, default: 'pending' # pending, approved, declined, voided, error
      String :payment_method_type
      String :wompi_transaction_id
      String :wompi_status
      Text :payment_data # JSON data from Wompi
      Text :shipping_address # JSON data
      Text :items # JSON data with cart items
      DateTime :created_at
      DateTime :updated_at

      index :reference
      index :customer_email
      index :wompi_transaction_id
      index :status
    end
  end

  down do
    drop_table(:orders)
  end
end
