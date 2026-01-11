# Use Ruby 3.4 Alpine for smaller image size
FROM ruby:3.4-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata \
    bash

# Set working directory
WORKDIR /app

# Copy Gemfile and Gemfile.lock
COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

# Copy application code
COPY . .

# Expose port 4567
EXPOSE 4567

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4567/api/products || exit 1

# Start the application
CMD ["bundle", "exec", "rackup", "-o", "0.0.0.0", "-p", "4567"]
