Sequel.migration do
  up do
    alter_table(:products) do
      add_column :stock, Integer, default: 0, null: false
    end
  end

  down do
    alter_table(:products) do
      drop_column :stock
    end
  end
end
