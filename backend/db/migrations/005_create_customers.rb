Sequel.migration do
  up do
    create_table(:customers) do
      primary_key :id
      String :email, null: false, unique: true
      String :full_name, null: false
      String :phone_number
      DateTime :created_at
      DateTime :updated_at

      index :email
    end
  end

  down do
    drop_table(:customers)
  end
end
