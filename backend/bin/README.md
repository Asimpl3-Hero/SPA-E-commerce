# 🛠️ Backend Scripts

Scripts de utilidad para desarrollo y testing.

## 📋 Scripts Disponibles

### 🧪 Testing

#### `test` / `test.bat`
Ejecutor rápido de tests con opciones.

```bash
# Windows
bin\test.bat                          # Ejecutar todos los tests
bin\test.bat -d                       # Con formato de documentación
bin\test.bat -f                       # Solo mostrar fallas
bin\test.bat spec\domain              # Tests de un directorio
bin\test.bat spec\...\product_spec.rb # Test específico

# Linux/macOS
bin/test                              # Ejecutar todos los tests
bin/test -d                           # Con formato de documentación
bin/test spec/domain                  # Tests de un directorio
```

**Opciones:**
- `-d`, `--documentation`: Formato detallado
- `-f`, `--failures`: Solo mostrar fallas
- `-h`, `--help`: Ayuda

---

#### `coverage` / `coverage.bat`
Ejecuta tests y abre el reporte de cobertura HTML.

```bash
# Windows
bin\coverage.bat

# Linux/macOS
bin/coverage
```

**Resultado:**
- Ejecuta todos los tests
- Genera reporte de cobertura
- Abre automáticamente en el navegador
- Muestra estadísticas en consola

---

#### `coverage-report` / `coverage-report.bat`
Genera reporte detallado de cobertura con estadísticas.

```bash
# Windows
bin\coverage-report.bat

# Linux/macOS
bin/coverage-report
```

**Genera:**
- `coverage/index.html` - Reporte visual HTML
- `coverage/coverage_summary.txt` - Resumen en texto
- `rspec_results.json` - Resultados JSON para CI/CD

---

#### `test-summary.bat`
Resumen rápido del estado de los tests (solo Windows).

```bash
bin\test-summary.bat
```

**Muestra:**
- Total de tests ejecutados
- Tests que pasaron/fallaron
- Porcentaje de cobertura
- Estado general (PASS/FAIL)

---

## 📊 Ejemplos de Uso

### Flujo de Desarrollo Normal

```bash
# 1. Ejecutar tests mientras desarrollas
bin\test.bat

# 2. Ver cobertura cuando termines
bin\coverage.bat

# 3. Verificar cobertura antes de commit
bin\test-summary.bat
```

### Debugging de Tests

```bash
# Ejecutar solo un archivo
bin\test.bat spec\domain\entities\product_spec.rb

# Ver detalles de lo que se está testeando
bin\test.bat -d spec\application\use_cases

# Ver solo las fallas
bin\test.bat -f
```

### Generar Reportes

```bash
# Reporte completo para revisión
bin\coverage-report.bat

# Esto genera:
# - coverage/index.html (abrir en navegador)
# - coverage/coverage_summary.txt (ver en terminal)
# - rspec_results.json (para CI/CD)
```

---

## 🎯 Salidas Esperadas

### ✅ Cuando Todo Está Bien

```
Running RSpec tests with coverage...

..................................................

Finished in 0.7 seconds
187 examples, 0 failures

================================================================================
✅ All tests passed!
================================================================================

📊 Coverage report generated at: coverage/index.html
📈 Opening coverage report in browser...

💡 Tips:
   - Coverage report: coverage/index.html
   - Re-run tests: bundle exec rspec
   - Run specific test: bundle exec rspec spec/path/to/file_spec.rb
```

### ❌ Cuando Hay Fallas

```
Running RSpec tests with coverage...

..........F.......F...

Failures:

  1) ProductController GET /products returns all products
     Expected status 200, got 500

Finished in 0.8 seconds
187 examples, 2 failures

================================================================================
❌ Tests failed! Exit code: 1
================================================================================
```

---

## 🔧 Troubleshooting

### Script no ejecuta (Windows)

**Problema:** `'bin\test.bat' no se reconoce...`

**Solución:**
```bash
# Asegúrate de estar en el directorio backend
cd backend

# Ejecuta con la ruta completa
.\bin\test.bat
```

### Script no ejecuta (Linux/macOS)

**Problema:** `Permission denied`

**Solución:**
```bash
# Hacer el script ejecutable
chmod +x bin/test bin/coverage bin/coverage-report

# Ahora ejecutar
bin/test
```

### Reporte de cobertura no abre

**Problema:** El navegador no se abre automáticamente

**Solución:**
```bash
# Abrir manualmente
start coverage/index.html      # Windows
open coverage/index.html       # macOS
xdg-open coverage/index.html   # Linux
```

---

## 📚 Recursos Adicionales

- **Guía de Testing Completa:** Ver [TESTING.md](../TESTING.md)
- **Documentación de RSpec:** https://rspec.info/
- **SimpleCov Docs:** https://github.com/simplecov-ruby/simplecov

---

## ✨ Tips

1. **Ejecuta tests frecuentemente** mientras desarrollas
2. **Mantén la cobertura > 80%** en todo momento
3. **Revisa el reporte HTML** para ver qué líneas faltan cubrir
4. **Usa `-d` para debugging** cuando un test falle
5. **Genera reportes** antes de hacer commits importantes
