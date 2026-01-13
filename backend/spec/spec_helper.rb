# frozen_string_literal: true

require 'simplecov'
SimpleCov.start do
  enable_coverage :branch

  add_filter '/spec/'
  add_filter '/config/'
  add_filter '/db/'

  add_group 'Controllers', 'lib/infrastructure/adapters/web'
  add_group 'Services', 'lib/infrastructure/adapters/payment'
  add_group 'Use Cases', 'lib/use_cases'
  add_group 'Entities', 'lib/domain/entities'
  add_group 'Repositories', 'lib/infrastructure/repositories'

  # Set minimum coverage thresholds
  minimum_coverage line: 70, branch: 80
end

ENV['RACK_ENV'] = 'test'

require 'bundler/setup'
require 'rack/test'
require 'webmock/rspec'
require 'database_cleaner/sequel'
require 'dotenv/load'

# Load the application
require_relative '../app'

# Load domain layer classes for testing
require_relative '../lib/domain/entities/product'
require_relative '../lib/domain/entities/category'
require_relative '../lib/domain/value_objects/money'
require_relative '../lib/domain/value_objects/result'

# Load support files
Dir[File.join(__dir__, 'support', '**', '*.rb')].sort.each { |file| require file }

# Configure WebMock
WebMock.disable_net_connect!(allow_localhost: true)

RSpec.configure do |config|
  config.include Rack::Test::Methods

  # Database Cleaner configuration
  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end

  # RSpec configuration
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
end
