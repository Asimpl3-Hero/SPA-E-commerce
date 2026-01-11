Sequel.migration do
  up do
    create_table(:transactions) do
      primary_key :id
      String :wompi_transaction_id, unique: true
      String :reference, null: false
      Integer :amount_in_cents, null: false
      String :currency, default: 'COP', null: false
      String :status, default: 'PENDING', null: false # PENDING, APPROVED, DECLINED, VOIDED, ERROR
      String :payment_method_type # CARD, NEQUI, etc
      String :payment_method_token
      Text :payment_data # JSON with full Wompi response
      String :signature # Integrity signature
      DateTime :created_at
      DateTime :updated_at

      index :wompi_transaction_id
      index :reference
      index :status
    end
  end

  down do
    drop_table(:transactions)
  end
end
