module Domain
  module Entities
    class Customer
      attr_reader :id, :email, :full_name, :phone_number, :created_at, :updated_at

      def initialize(
        id:,
        email:,
        full_name:,
        phone_number: nil,
        created_at: nil,
        updated_at: nil
      )
        @id = id
        @email = email
        @full_name = full_name
        @phone_number = phone_number
        @created_at = created_at
        @updated_at = updated_at
      end

      def to_h
        {
          id: @id,
          email: @email,
          full_name: @full_name,
          phone_number: @phone_number,
          created_at: @created_at,
          updated_at: @updated_at
        }.compact
      end

      def valid_email?
        return false if @email.nil? || @email.empty?
        @email.match?(/\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i)
      end
    end
  end
end
