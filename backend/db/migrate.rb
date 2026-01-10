require_relative '../config/database'

namespace = File.dirname(__FILE__)
Sequel.extension :migration

DB = Config::Database.connection

if ARGV[0] == 'down'
  Sequel::Migrator.run(DB, "#{namespace}/migrations", target: 0)
  puts "All migrations rolled back"
else
  Sequel::Migrator.run(DB, "#{namespace}/migrations")
  puts "Migrations completed successfully"
end
