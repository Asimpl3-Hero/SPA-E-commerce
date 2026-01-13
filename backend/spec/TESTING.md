# 🧪 Testing Guide - Backend

Guía completa para ejecutar y mantener los tests del backend.

## 📊 Estadísticas Actuales

```
Total de Tests:     187 ejemplos
Cobertura:          99.75% (397/398 líneas)
Estado:             ✅ TODOS LOS TESTS PASAN
Objetivo:           80% ✅ SUPERADO
```

## 🚀 Ejecución Rápida

### Windows

```bash
# Ejecutar todos los tests
bin\test.bat

# Ejecutar tests con formato de documentación
bin\test.bat -d

# Ver reporte de cobertura
bin\coverage.bat

# Generar reporte detallado
bin\coverage-report.bat
```

### Linux/macOS

```bash
# Ejecutar todos los tests
bundle exec rspec
# o usar el script
bin/test

# Ejecutar tests con formato de documentación
bin/test -d

# Ver reporte de cobertura
bin/coverage

# Generar reporte detallado
bin/coverage-report
```

## 📁 Estructura de Tests

```
spec/
├── spec_helper.rb                    # Configuración de RSpec y SimpleCov
├── support/
│   └── test_helpers.rb              # Helpers compartidos
│
├── domain/
│   ├── entities/
│   │   ├── product_spec.rb          # 18 tests - Entidad Product
│   │   └── category_spec.rb         # 5 tests - Entidad Category
│   └── value_objects/
│       ├── money_spec.rb            # 18 tests - Value Object Money
│       └── result_spec.rb           # 19 tests - Railway Pattern
│
├── application/
│   ├── ports/
│   │   ├── product_repository_spec.rb    # 9 tests - Interface
│   │   └── category_repository_spec.rb   # 4 tests - Interface
│   └── use_cases/
│       ├── get_all_products_spec.rb      # 4 tests
│       ├── get_product_by_id_spec.rb     # 7 tests
│       ├── search_products_spec.rb       # 11 tests
│       ├── get_all_categories_spec.rb    # 3 tests
│       └── create_product_spec.rb        # 16 tests
│
└── infrastructure/
    └── adapters/
        ├── repositories/
        │   ├── sequel_product_repository_spec.rb   # 28 tests - SQLite in-memory
        │   └── sequel_category_repository_spec.rb  # 14 tests - SQLite in-memory
        ├── web/
        │   ├── health_controller_spec.rb           # 7 tests
        │   ├── products_controller_spec.rb         # 11 tests
        │   └── categories_controller_spec.rb       # 3 tests
        └── payment/
            └── wompi_service_spec.rb               # 10 tests - WebMock
```

## 🎯 Tipos de Tests

### 1. Tests Unitarios (Domain Layer)

Tests puros sin dependencias externas:

```ruby
# spec/domain/entities/product_spec.rb
RSpec.describe Domain::Entities::Product do
  it 'calculates discount percentage correctly' do
    product = described_class.new(
      id: 1,
      name: 'Test Product',
      price: 75.0,
      original_price: 100.0,
      # ...
    )

    expect(product.discount_percentage).to eq(25)
  end
end
```

### 2. Tests con Doubles/Mocks (Application Layer)

Tests que usan dobles para aislar dependencias:

```ruby
# spec/application/use_cases/get_all_products_spec.rb
RSpec.describe Application::UseCases::GetAllProducts do
  let(:product_repository) { double('ProductRepository') }

  it 'returns success with products array' do
    allow(product_repository).to receive(:find_all)
      .and_return([product1, product2])

    result = use_case.call
    expect(result).to be_success
  end
end
```

### 3. Tests de Repositorio (In-Memory Database)

Tests con SQLite en memoria para rapidez:

```ruby
# spec/infrastructure/adapters/repositories/sequel_product_repository_spec.rb
RSpec.describe SequelProductRepository, db: true do
  let(:db) { Sequel.sqlite }

  before do
    db.create_table :products do
      # ...
    end
  end

  it 'finds products by category' do
    products = repository.find_by_category('Electronics')
    expect(products.size).to eq(1)
  end
end
```

### 4. Tests de Integración (WebMock)

Tests que simulan APIs externas:

```ruby
# spec/infrastructure/adapters/payment/wompi_service_spec.rb
RSpec.describe WompiService do
  it 'creates transaction successfully' do
    stub_request(:post, "#{base_url}/transactions")
      .to_return(status: 200, body: response.to_json)

    result = described_class.create_transaction(params)
    expect(result[:success]).to be(true)
  end
end
```

## 🔧 Comandos Útiles

### Ejecutar Tests Específicos

```bash
# Ejecutar un archivo de test
bundle exec rspec spec/domain/entities/product_spec.rb

# Ejecutar un directorio
bundle exec rspec spec/domain

# Ejecutar un test específico por línea
bundle exec rspec spec/domain/entities/product_spec.rb:25

# Ejecutar tests que coincidan con un patrón
bundle exec rspec --pattern 'spec/**/*_repository_spec.rb'
```

### Formatos de Salida

```bash
# Formato de progreso (por defecto)
bundle exec rspec

# Formato de documentación
bundle exec rspec --format documentation

# Solo mostrar fallos
bundle exec rspec --format failures

# Formato JSON para CI/CD
bundle exec rspec --format json --out results.json
```

### Opciones Avanzadas

```bash
# Ejecutar solo tests que fallaron la última vez
bundle exec rspec --only-failures

# Ejecutar en orden aleatorio (por defecto)
bundle exec rspec --order random

# Ejecutar en orden definido
bundle exec rspec --order defined

# Ver los 10 tests más lentos
bundle exec rspec --profile 10

# Ejecutar con seed específico para reproducibilidad
bundle exec rspec --seed 12345
```

## 📈 Cobertura de Código

### Ver Reporte HTML

```bash
# Generar y abrir reporte
bin/coverage.bat  # Windows
bin/coverage      # Linux/macOS

# O manualmente
bundle exec rspec
start coverage/index.html  # Windows
open coverage/index.html   # macOS
```

### Configuración de SimpleCov

El archivo `spec/spec_helper.rb` configura SimpleCov:

```ruby
SimpleCov.start do
  add_filter '/spec/'
  add_filter '/db/'
  add_filter '/config/'

  add_group 'Domain Entities', 'lib/domain/entities'
  add_group 'Domain Value Objects', 'lib/domain/value_objects'
  add_group 'Application Use Cases', 'lib/application/use_cases'
  # ...

  minimum_coverage 80
end
```

### Interpretar el Reporte

- **Verde**: Línea ejecutada por los tests
- **Rojo**: Línea NO ejecutada
- **Amarillo**: Línea parcialmente cubierta (ej: condición if/else)

## 🛠️ Troubleshooting

### Tests Fallan por Conexión a Base de Datos

**Problema**: `PG::ConnectionBad: connection refused`

**Solución**: Los tests de repositorio usan SQLite in-memory, no necesitan PostgreSQL. Verifica que el test esté marcado con `db: true`:

```ruby
RSpec.describe MyRepository, db: true do
  let(:db) { Sequel.sqlite }
  # ...
end
```

### WebMock Bloquea Conexiones HTTP

**Problema**: `Real HTTP connections are disabled`

**Solución**: Asegúrate de stubear todas las peticiones HTTP:

```ruby
stub_request(:post, "https://api.example.com/endpoint")
  .to_return(status: 200, body: '{"result": "ok"}')
```

### Cobertura Baja Inesperada

**Problema**: La cobertura está por debajo del 80%

**Solución**:
1. Verifica que todos los archivos nuevos tengan tests
2. Ejecuta `bin/coverage-report` para ver qué líneas faltan
3. Revisa el reporte HTML para identificar código sin cubrir

### Tests Muy Lentos

**Problema**: Los tests tardan mucho en ejecutar

**Solución**:
1. Usa `--profile 10` para identificar tests lentos
2. Considera usar mocks en lugar de base de datos
3. Evita `sleep` en los tests
4. Usa `let` en lugar de `before` cuando sea posible

## 📝 Mejores Prácticas

### 1. Nomenclatura

```ruby
# ❌ Malo
it 'test 1' do
  # ...
end

# ✅ Bueno
it 'returns success when product exists' do
  # ...
end
```

### 2. Arrange-Act-Assert

```ruby
it 'creates a new product' do
  # Arrange (preparar)
  product_data = { name: 'Test', price: 100 }

  # Act (actuar)
  result = use_case.call(product_data)

  # Assert (verificar)
  expect(result).to be_success
  expect(result.value![:name]).to eq('Test')
end
```

### 3. Un Concepto por Test

```ruby
# ❌ Malo - muchas verificaciones
it 'works correctly' do
  expect(product.name).to eq('Test')
  expect(product.price).to eq(100)
  expect(product.in_stock?).to be(true)
  expect(product.has_discount?).to be(false)
end

# ✅ Bueno - un concepto
it 'has the correct name' do
  expect(product.name).to eq('Test')
end

it 'is in stock' do
  expect(product.in_stock?).to be(true)
end
```

### 4. Usar Contexts

```ruby
describe '#find_by_id' do
  context 'when product exists' do
    it 'returns the product' do
      # ...
    end
  end

  context 'when product does not exist' do
    it 'returns nil' do
      # ...
    end
  end
end
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: 3.0

      - name: Install dependencies
        run: bundle install

      - name: Run tests
        run: bundle exec rspec

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/.resultset.json
```

## 📚 Recursos Adicionales

- [RSpec Documentation](https://rspec.info/)
- [SimpleCov Documentation](https://github.com/simplecov-ruby/simplecov)
- [WebMock Documentation](https://github.com/bblimke/webmock)
- [Database Cleaner Documentation](https://github.com/DatabaseCleaner/database_cleaner)

## ✅ Checklist para Nuevos Tests

- [ ] El test tiene un nombre descriptivo
- [ ] Sigue el patrón Arrange-Act-Assert
- [ ] Usa mocks/stubs apropiadamente
- [ ] No tiene dependencias externas innecesarias
- [ ] Es independiente (puede ejecutarse solo)
- [ ] Es rápido (< 0.1s idealmente)
- [ ] La cobertura se mantiene > 80%
- [ ] Todos los tests pasan
