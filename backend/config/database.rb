require 'sequel'
require 'dotenv/load'

module Config
  class Database
    def self.connection
      @connection ||= Sequel.connect(
        ENV['DATABASE_URL'] || 'postgres://localhost/ecommerce_dev',
        max_connections: 10,
        logger: Logger.new($stdout)
      )
    end

    def self.disconnect
      @connection&.disconnect
      @connection = nil
    end

    def self.reset_connection
      disconnect
      connection
    end
  end
end
