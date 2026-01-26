require 'simplecov'

SimpleCov.start do
  add_filter '/spec/'
  add_filter '/db/'
  add_filter '/config/'

  add_group 'Domain Entities', 'lib/domain/entities'
  add_group 'Application Services', 'lib/application/services'
  add_group 'Application Use Cases', 'lib/application/use_cases'
  add_group 'Application Ports', 'lib/application/ports'
  add_group 'Infrastructure Repositories', 'lib/infrastructure/adapters/repositories'
  add_group 'Infrastructure Controllers', 'lib/infrastructure/adapters/web'
  add_group 'Infrastructure Payment', 'lib/infrastructure/adapters/payment'

  minimum_coverage 80
end

ENV['RACK_ENV'] = 'test'
ENV['DATABASE_URL'] ||= 'postgres://localhost/ecommerce_test'

require 'rspec'
require 'rack/test'
require 'webmock/rspec'
require 'database_cleaner/sequel'
require 'dotenv/load'

# Require application files
require_relative '../lib/domain/entities/product'
require_relative '../lib/domain/entities/category'

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.filter_run_when_matching :focus
  config.example_status_persistence_file_path = 'spec/examples.txt'
  config.disable_monkey_patching!
  config.warnings = false

  if config.files_to_run.one?
    config.default_formatter = 'doc'
  end

  config.profile_examples = 10
  config.order = :random
  Kernel.srand config.seed

  # WebMock configuration
  WebMock.disable_net_connect!(allow_localhost: false)

  # Database cleaner configuration
  config.before(:suite) do
    # Only setup database cleaner if we have database connection and not using in-memory db
    if defined?(Config::Database) && ENV['RACK_ENV'] != 'test'
      begin
        DatabaseCleaner[:sequel].db = Config::Database.connection
        DatabaseCleaner[:sequel].strategy = :transaction
        DatabaseCleaner[:sequel].clean_with(:truncation)
      rescue => e
        # Skip database cleaner setup if connection fails (using in-memory db)
        puts "Skipping DatabaseCleaner setup: #{e.message}"
      end
    end
  end

  config.around(:each) do |example|
    # Only use database cleaner for tests explicitly marked with :use_postgres
    if example.metadata[:use_postgres]
      begin
        DatabaseCleaner[:sequel].cleaning do
          example.run
        end
      rescue => e
        # If database cleaner fails, just run the example
        example.run
      end
    else
      # Run example normally for all other tests (including in-memory SQLite tests)
      example.run
    end
  end
end
