Sequel.migration do
  up do
    create_table(:deliveries) do
      primary_key :id
      String :address_line_1, null: false
      String :address_line_2
      String :city, null: false
      String :region # State/Department
      String :country, default: 'CO', null: false
      String :postal_code
      String :phone_number
      Text :delivery_notes
      String :status, default: 'pending' # pending, assigned, in_transit, delivered, failed
      DateTime :estimated_delivery_date
      DateTime :actual_delivery_date
      DateTime :created_at
      DateTime :updated_at

      index :status
    end
  end

  down do
    drop_table(:deliveries)
  end
end
