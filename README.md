# 🛍️ E-Commerce SPA

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Ruby](https://img.shields.io/badge/Ruby-3.x-CC342D?style=for-the-badge&logo=ruby&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11.2-764ABC?style=for-the-badge&logo=redux&logoColor=white)

**Tienda en línea moderna con React + Ruby + Wompi**

Una aplicación full-stack de e-commerce educativa que demuestra arquitectura limpia, integración de pagos y mejores prácticas de desarrollo.

## 🌐 Producción

- **Frontend:** [https://techvault.ondeploy.store/](https://techvault.ondeploy.store/)
- **API + Swagger:** [https://api-techvault.ondeploy.store/swagger-ui.html](https://api-techvault.ondeploy.store/swagger-ui.html)

## 📖 Documentación

- 📱 **[Frontend README](frontend/README.md)** - Documentación completa del frontend
- 💎 **[Backend README](backend/README.md)** - Documentación completa del backend

---

## ✨ ¿Qué hace esta app?

- 🛒 **Navega productos** → Busca, filtra y explora el catálogo
- 🎨 **Carrito inteligente** → Persiste entre sesiones (localStorage)
- 💳 **Paga en línea** → Tarjetas y Nequi con Wompi (sandbox)
- 🧾 **Genera factura** → Comprobante detallado después del pago
- 🌓 **Tema claro/oscuro** → Cambia según tu preferencia
- 📱 **100% Responsive** → Funciona en móvil, tablet y desktop

---

## 🚀 Inicio Rápido (5 minutos)

### **Necesitas tener instalado:**

- Node.js 18+
- Ruby 3.0+
- PostgreSQL 12+

### **1️⃣ Clona el repo**

```bash
git clone <repo-url>
cd SPA-E-commerce
```

### **2️⃣ Levanta el backend**

```bash
cd backend
bundle install                    # Instala dependencias
createdb ecommerce_dev            # Crea la base de datos
ruby db/migrate.rb                # Ejecuta migraciones
ruby db/seeds/seed.rb             # Carga datos de prueba
bundle exec rerun 'rackup -p 4567'  # Inicia servidor
```

### **3️⃣ Levanta el frontend**

```bash
cd ../frontend
npm install                       # Instala dependencias
npm run dev                       # Inicia servidor
```

### **4️⃣ ¡A probar! 🎉**

> 💡 **Tip**: Usa la tarjeta de prueba `4242 4242 4242 4242` para simular pagos.

---

## 🛠️ Stack Tecnológico

**Frontend**

- ⚛️ React 19 + Redux Toolkit
- ⚡ Vite (build tool súper rápido)
- 🎨 CSS Modules
- 🧪 Jest + Testing Library

**Backend**

- 💎 Ruby + Sinatra
- 🐘 PostgreSQL
- 🏛️ Arquitectura Hexagonal
- 💰 Wompi API (pagos)

---

## 📸 ¿Cómo funciona?

### **Flujo simplificado:**

```
1. Usuario navega productos
      ↓
2. Agrega al carrito → Se guarda en localStorage
      ↓
3. Click en "Pagar" → Abre modal de checkout
      ↓
4. Completa formulario:
   • Datos personales
   • Método de pago (tarjeta o Nequi)
      ↓
5. Click "Completar Pago":
   • Frontend tokeniza tarjeta con Wompi
   • Backend crea orden y procesa transacción
   • Polling cada 2s para verificar estado
      ↓
6. Pago aprobado ✅
   • Muestra modal de éxito
   • Genera factura descargable
   • Vacía el carrito
```

## 📚 Documentación Completa

¿Quieres entender a fondo cómo funciona? Lee la documentación detallada:

- 📱 **[Frontend](frontend/README.md)** - React, Redux, hooks, componentes, flujos
- 💎 **[Backend](backend/README.md)** - Ruby, Sinatra, arquitectura hexagonal, API
- 📖 **[Swagger UI](http://localhost:4567/api-docs)** - Documentación interactiva de la API

---

## ⚙️ Variables de Entorno

Necesitas configurar estas variables para que todo funcione:

### **Frontend** (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4567/api
VITE_WOMPI_PUBLIC_KEY=pub_test_tu_clave_aqui
```

### **Backend** (`backend/.env`)

```env
DATABASE_URL=postgres://user:password@localhost/ecommerce_dev
PORT=4567
FRONTEND_URL=http://localhost:puerto
WOMPI_PUBLIC_KEY=pub_test_tu_clave_aqui
WOMPI_PRIVATE_KEY=prv_test_tu_clave_aqui
WOMPI_EVENTS_SECRET=test_events_tu_secreto
WOMPI_INTEGRITY_SECRET=test_integrity_tu_secreto
```

> ⚠️ Obtén tus claves en [comercios.wompi.co](https://comercios.wompi.co)

---

## 🧪 Testing

**Frontend:**

```bash
npm test              # Ejecutar tests
npm run test:watch    # Modo watch
npm run test:coverage # Ver cobertura
```

**Backend:**

```bash
bundle exec rspec     # Ejecutar tests
```

---

## 📁 Estructura del Proyecto

```
SPA-E-commerce/
│
├── frontend/              # 📱 React SPA
│   ├── src/
│   │   ├── components/   # Componentes (UI, Checkout, etc.)
│   │   ├── store/        # Redux (carrito)
│   │   ├── services/     # API + Wompi Gateway
│   │   ├── hooks/        # Custom hooks
│   │   └── styles/       # CSS
│   └── README.md         # Doc detallada
│
├── backend/              # 💎 Ruby API
│   ├── lib/
│   │   ├── domain/       # Entidades de negocio
│   │   ├── application/  # Use Cases (ROP)
│   │   └── infrastructure/
│   │       ├── adapters/
│   │       │   ├── repositories/  # DB
│   │       │   ├── payment/       # Wompi
│   │       │   └── web/           # Controllers
│   ├── db/               # Migraciones + seeds
│   └── README.md         # Doc detallada
│
└── README.md             # Este archivo
```

---

## 💳 Tarjetas de Prueba (Wompi Sandbox)

Usa estos datos para simular pagos:

**VISA (Aprobada):**

```
Número: 4242 4242 4242 4242
CVC: 123
Fecha: Cualquier fecha futura (ej: 12/25)
```

**Mastercard (Declinada):**

```
Número: 5555 5555 5555 4444
CVC: 123
```

**Nequi:**

```
Teléfono: 3001234567
```

---

## 🐛 Problemas Comunes

**❌ Frontend no conecta con backend**

- Verifica que `VITE_API_URL` en `.env` apunte a `http://localhost:4567/api`
- Asegúrate que el backend esté corriendo en el puerto 4567
- Revisa la consola del navegador para errores CORS

**❌ Error de base de datos**

- Verifica que PostgreSQL esté corriendo: `psql --version`
- Confirma las credenciales en `DATABASE_URL`
- Ejecuta las migraciones: `ruby db/migrate.rb`

**❌ Pago rechazado en Wompi**

- Usa las tarjetas de prueba correctas (ver sección de arriba)
- Verifica que las claves en `.env` sean correctas
- En sandbox, el monto debe estar en centavos (ej: 10000 = $100 COP)

---

## 🤝 Contribuir

¿Quieres mejorar este proyecto? ¡Adelante!

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/MiFeature`)
3. Agrega tests para tu feature
4. Commit (`git commit -m 'Add: mi nueva feature'`)
5. Push (`git push origin feature/MiFeature`)
6. Abre un Pull Request

---

## 📄 Licencia

MIT License - Proyecto educativo y de código abierto.

---

## 🎓 Aprendizajes Clave

Este proyecto demuestra:

✅ **Frontend**

- Gestión de estado complejo con Redux
- Custom hooks reutilizables
- Integración con APIs externas (Wompi)
- Manejo de formularios y validaciones
- Persistencia de datos en localStorage

✅ **Backend**

- Arquitectura Hexagonal (Ports & Adapters)
- Railway Oriented Programming
- Separación de responsabilidades
- Integración con pasarelas de pago
- Testing exhaustivo

✅ **Full-Stack**

- Comunicación REST
- Manejo de errores robusto
- Flujos de pago seguros
- Documentación clara

---

**¡Happy coding! 🚀**

<div align="center">
  <sub>Hecho con ❤️ para aprender y compartir conocimiento</sub>
</div>
