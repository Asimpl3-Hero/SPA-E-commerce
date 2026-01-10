Sequel.migration do
  change do
    create_table(:products) do
      primary_key :id
      String :name, null: false
      Numeric :price, null: false
      Numeric :original_price, null: true
      Float :rating, default: 0.0
      Integer :reviews, default: 0
      String :category, null: false
      Text :description, null: false
      String :image, null: false
      String :badge_text, null: true
      String :badge_variant, null: true
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP

      index :category
      index :name
      index [:price, :category]
    end
  end
end
