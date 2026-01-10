Sequel.migration do
  change do
    create_table(:categories) do
      primary_key :id
      String :name, null: false, unique: true
      String :slug, null: false, unique: true
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP

      index :slug
    end
  end
end
