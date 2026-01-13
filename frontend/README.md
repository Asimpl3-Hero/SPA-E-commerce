# 📱 Documentación Frontend - E-Commerce SPA

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11.2-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-Testing-C21325?style=for-the-badge&logo=jest&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS_Modules-1572B6?style=for-the-badge&logo=css3&logoColor=white)

## 🌐 Producción

![TechVault Demo](public/videos/Review.gif)

**Aplicación en vivo:** [https://techvault.ondeploy.store/](https://techvault.ondeploy.store/)

Visita la aplicación desplegada para ver el proyecto en acción.

---

## 🎯 Visión General

Esta es una **Single Page Application (SPA)** de e-commerce construida con **React 19** y **Vite**, que permite a los usuarios navegar productos, agregar al carrito y realizar pagos en línea a través de **Wompi**.

### 🛠️ Stack Tecnológico

- ⚛️ **React 19.2.0** - Interfaz de usuario
- ⚡ **Vite 7.2.4** - Build tool y dev server
- 📦 **Redux Toolkit 2.11.2** - Gestión de estado global
- 🎨 **CSS Modules** - Estilos con alcance local
- 🧪 **Jest + Testing Library** - Testing

---

## 📂 Estructura del Proyecto

```
frontend/src/
├── components/          # 🧩 Componentes React
│   ├── ui/             # 🎨 Componentes de UI reutilizables
│   ├── checkout/       # 💳 Componentes de pago
│   └── ux/             # ✨ Componentes de experiencia
├── store/              # 🗃️ Redux store y slices
├── services/           # 🌐 Servicios API
│   └── paymentGateways/ # 💰 Gateways de pago
├── hooks/              # 🎣 Custom hooks
├── contexts/           # 🌍 React contexts
├── utils/              # 🔧 Funciones auxiliares
├── constants/          # 📝 Constantes y config
└── styles/             # 🎨 Archivos CSS
```

---

## 🔄 Flujo de la Aplicación

### 1️⃣ **Inicio y Carga de Productos**

```
Usuario visita la app
    ↓
main.jsx inicializa React
    ↓
App.jsx renderiza con ThemeProvider
    ↓
useEffect llama getAllProducts()
    ↓
productService.js hace fetch a /api/products
    ↓
Productos se guardan en estado local
    ↓
Se renderizan en ProductCarousel y ProductGrid
```

**Archivo principal:** [App.jsx](src/App.jsx)

```jsx
// Al montar el componente, carga todos los productos
useEffect(() => {
  const fetchProducts = async () => {
    const data = await getAllProducts();
    setProducts(transformedProducts);
  };
  fetchProducts();
}, []);
```

---

### 2️⃣ **Navegación y Búsqueda**

```
Usuario escribe en buscador (Header)
    ↓
useDebounce espera 300ms sin cambios
    ↓
ProductGrid filtra productos localmente
    ↓
Resultados se actualizan en tiempo real
```

**Componentes clave:**

- 🔍 [search-with-suggestions.jsx](src/components/search-with-suggestions.jsx) - Barra de búsqueda
- ⏱️ [useDebounce.js](src/hooks/useDebounce.js) - Hook para optimizar búsquedas

---

### 3️⃣ **Agregar al Carrito**

```
Usuario hace clic en "Agregar al Carrito"
    ↓
Se dispara dispatch(addItem(product))
    ↓
Redux actualiza cart.items[]
    ↓
store.subscribe() guarda en localStorage
    ↓
Badge del carrito actualiza contador
    ↓
CartDrawer puede abrirse para ver items
```

**Archivo clave:** [cartSlice.js](src/store/cartSlice.js)

```javascript
// Reducers de Redux Toolkit
addItem: (state, action) => {
  const existingItem = state.items.find(
    (item) => item.id === action.payload.id
  );
  if (existingItem) {
    existingItem.quantity += 1; // ➕ Incrementa cantidad
  } else {
    state.items.push({ ...action.payload, quantity: 1 }); // ✨ Nuevo item
  }
};
```

**Hook personalizado:** [useCart.js](src/hooks/useCart.js)

- Provee funciones: `addToCart()`, `removeFromCart()`, `incrementQuantity()`, etc.
- Encapsula lógica de Redux para facilitar uso

---

### 4️⃣ **Gestión del Carrito**

```
Usuario abre CartDrawer
    ↓
Se muestra lista de items con cantidades
    ↓
Usuario puede:
  • ➕ Incrementar cantidad
  • ➖ Decrementar cantidad
  • 🗑️ Eliminar item
  • 🧹 Vaciar carrito
    ↓
Todos los cambios se persisten en localStorage
    ↓
Se calcula subtotal, IVA (19%) y total
```

**Componente:** [cart-drawer.jsx](src/components/cart-drawer.jsx)

**Características especiales:**

- 🔒 Bloquea scroll del body cuando está abierto
- 👆 Se cierra al hacer clic afuera
- 💾 Persistencia automática en localStorage

---

### 5️⃣ **Proceso de Checkout (Flujo Principal)**

Este es el flujo más complejo de la aplicación:

```
🛒 Usuario hace clic en "Pagar" en CartDrawer
    ↓
✅ Validación: ¿Hay items?
    ↓
📝 Se abre CheckoutModal
    ↓
👤 Usuario completa CustomerForm:
   • Email
   • Nombre
   • Teléfono
    ↓
💳 Selecciona método de pago (PaymentMethodSelector):
   • CARD (Tarjeta)
   • NEQUI
    ↓
📋 Si CARD → completa CardForm:
   • Número (detecta tipo: Visa/Mastercard)
   • CVC
   • Fecha expiración
   • Nombre titular
    ↓
📱 Si NEQUI → completa NequiForm:
   • Número de celular
    ↓
🔍 Usuario revisa OrderSummary
    ↓
✓ Click en "Completar Pago"
    ↓
⚙️ useUnifiedCheckout procesa:
```

**Subproceso de pago:**

```
1️⃣ Validación de formulario
   ├─ Datos de cliente
   └─ Datos de pago (usa WompiGateway.validate())
    ↓
2️⃣ Tokenización (solo tarjetas)
   └─ WompiGateway.tokenize(cardData)
       └─ POST a Wompi Sandbox API
           └─ Retorna token seguro
    ↓
3️⃣ Creación de orden
   └─ WompiGateway.processPayment(orderData)
       └─ POST /api/orders/checkout
           ├─ Backend crea orden en DB
           └─ Backend crea transacción en Wompi
    ↓
4️⃣ Polling de estado
   └─ WompiGateway.getPaymentStatus(transactionId)
       └─ GET /api/transactions/:id/status
           └─ Consulta cada 2s hasta:
               • APPROVED ✅
               • DECLINED ❌
               • ERROR ⚠️
               • Timeout (30s)
    ↓
5️⃣ Manejo de resultado
   ├─ APPROVED:
   │   ├─ Vaciar carrito
   │   ├─ Cerrar modal
   │   ├─ Mostrar SuccessModal
   │   └─ Preparar datos de factura
   │
   ├─ DECLINED:
   │   └─ Mostrar alerta de rechazo
   │
   └─ ERROR:
       └─ Mostrar alerta de error
```

**Archivos involucrados:**

1. 🎯 [useUnifiedCheckout.js](src/hooks/useUnifiedCheckout.js) - Orquestador principal
2. 💰 [WompiGateway.js](src/services/paymentGateways/WompiGateway.js) - Integración con Wompi
3. 📋 [checkout-modal.jsx](src/components/checkout-modal.jsx) - UI del checkout

---

### 6️⃣ **Post-Pago y Facturación**

```
✅ Pago aprobado
    ↓
🎉 Se muestra SuccessModal
   • Número de referencia
   • Botones:
     - "Ver Factura" 📄
     - "Seguir Comprando" 🛍️
    ↓
📄 Usuario hace clic en "Ver Factura"
    ↓
📋 Se abre InvoiceModal con:
   • Datos del cliente
   • Lista de productos
   • Desglose de precios
   • Método de pago
   • Referencia de orden
    ↓
💾 Usuario puede descargar PDF (funcionalidad futura)
```

**Componentes:**

- 🎊 [success-modal.jsx](src/components/ui/success-modal.jsx)
- 🧾 [invoice-modal.jsx](src/components/ui/invoice-modal.jsx)

---

## 🎨 Sistema de Temas

La aplicación soporta **modo claro y oscuro**:

```
Usuario hace clic en ThemeToggle
    ↓
ThemeContext actualiza estado
    ↓
CSS custom properties se actualizan
    ↓
Toda la UI cambia de tema instantáneamente
```

**Archivos:**

- 🌓 [ThemeContext.jsx](src/contexts/ThemeContext.jsx)
- 🔘 [theme-toggle.jsx](src/components/ui/theme-toggle.jsx)

---

## 🔌 Integración con Backend

### 📡 Servicios API

#### **ProductService** ([productService.js](src/services/productService.js))

| Método                    | Endpoint                    | Descripción                    |
| ------------------------- | --------------------------- | ------------------------------ |
| `getAllProducts(filters)` | `GET /api/products`         | 📦 Obtiene todos los productos |
| `getProductById(id)`      | `GET /api/products/:id`     | 🔍 Obtiene un producto         |
| `searchProducts(query)`   | `GET /api/products?search=` | 🔎 Busca productos             |

#### **CheckoutService** ([checkoutService.js](src/services/checkoutService.js))

| Método                      | Endpoint                           | Descripción                  |
| --------------------------- | ---------------------------------- | ---------------------------- |
| `createCheckout(data)`      | `POST /api/orders/checkout`        | 💳 Crea orden y procesa pago |
| `pollTransactionStatus(id)` | `GET /api/transactions/:id/status` | 🔄 Consulta estado de pago   |

---

## 🎣 Hooks Personalizados

| Hook                 | Propósito                                  | Ubicación                                                |
| -------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `useCart`            | 🛒 Gestión del carrito (wrapper de Redux)  | [useCart.js](src/hooks/useCart.js)                       |
| `useDebounce`        | ⏱️ Optimiza búsquedas retrasando ejecución | [useDebounce.js](src/hooks/useDebounce.js)               |
| `useUnifiedCheckout` | 💳 Orquesta todo el proceso de checkout    | [useUnifiedCheckout.js](src/hooks/useUnifiedCheckout.js) |
| `useOnClickOutside`  | 👆 Detecta clics fuera de un elemento      | [useOnClickOutside.js](src/hooks/useOnClickOutside.js)   |

---

## 🗃️ Gestión de Estado

### **Redux Store**

```javascript
store = {
  cart: {
    items: [
      // 🛒 Productos en el carrito
      { id, name, price, quantity, image },
    ],
    isOpen: false, // 👁️ Estado del drawer
  },
};
```

### **Persistencia**

```javascript
// Al cargar
localStorage.getItem('cart') → Redux initialState

// Al cambiar
store.subscribe() → localStorage.setItem('cart', state)
```

**Archivo:** [store.js](src/store/store.js)

---

## 💰 Sistema de Pagos (Wompi)

### **Arquitectura de Gateway**

```
BasePaymentGateway (clase abstracta)
    ↓
WompiGateway (implementación)
    ↓
Métodos:
  • tokenize()          - 🔐 Tokeniza tarjeta
  • processPayment()    - 💳 Procesa pago
  • getPaymentStatus()  - 🔍 Consulta estado
  • validate()          - ✅ Valida datos
  • detectCardType()    - 🏦 Detecta Visa/Mastercard
```

**Características:**

- 🔒 Nunca envía datos de tarjeta al backend (tokeniza primero)
- 🔄 Polling inteligente del estado de transacción
- 🎯 Soporte para múltiples métodos (tarjeta, Nequi)
- ✅ Validación de formularios integrada

**Archivo:** [WompiGateway.js](src/services/paymentGateways/WompiGateway.js)

---

## 🎨 Componentes UI Reutilizables

| Componente | Función                   | Props principales             |
| ---------- | ------------------------- | ----------------------------- |
| `Button`   | 🔘 Botón con variantes    | `variant`, `size`, `disabled` |
| `Card`     | 🗃️ Contenedor con estilos | `children`                    |
| `Badge`    | 🏷️ Etiqueta pequeña       | `variant`, `children`         |
| `Input`    | ⌨️ Campo de entrada       | `type`, `value`, `onChange`   |
| `Alert`    | ⚠️ Notificaciones         | `type`, `title`, `message`    |

**Ubicación:** [components/ui/](src/components/ui/)

---

## 🧪 Testing

### **Cobertura de Tests**

```bash
npm run test           # ▶️ Ejecutar tests
npm run test:watch     # 👁️ Modo watch
npm run test:coverage  # 📊 Cobertura
```

### **Áreas cubiertas:**

- ✅ Componentes de checkout
- ✅ Hooks personalizados
- ✅ Redux slices
- ✅ Servicios API
- ✅ Utilidades

**Herramientas:**

- Jest
- React Testing Library
- User Event

---

## 🚀 Comandos de Desarrollo

```bash
# 🏃 Desarrollo
npm run dev           # Inicia servidor en http://localhost:5173

# 🏗️ Producción
npm run build         # Construye para producción
npm run preview       # Preview del build

# 🧹 Linting
npm run lint          # Verifica código
```

---

## 🔑 Variables de Entorno

```env
VITE_API_URL=http://localhost:3001/api    # 🌐 URL del backend
VITE_WOMPI_PUBLIC_KEY=pub_test_xxx        # 🔑 Wompi public key
```

**Archivo:** `.env` en la raíz de frontend

---

## 📊 Flujo de Datos Completo (Diagrama)

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND SPA                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [App.jsx] ─────► [ProductService] ────► Backend /products  │
│      │                                           │           │
│      ▼                                           ▼           │
│  [ProductGrid]                            Products JSON      │
│  [ProductCarousel]                              │           │
│      │                                           │           │
│      ▼                                           ▼           │
│  [ProductCard] ──► Click                  Update State      │
│      │                                                       │
│      ▼                                                       │
│  dispatch(addItem) ───► Redux Store ───► localStorage       │
│                              │                               │
│                              ▼                               │
│                         cart.items[]                         │
│                              │                               │
│                              ▼                               │
│  [CartDrawer] ◄──────── useCart hook                        │
│      │                                                       │
│      ▼                                                       │
│  Click "Pagar"                                              │
│      │                                                       │
│      ▼                                                       │
│  [CheckoutModal]                                            │
│      │                                                       │
│      ├──► [CustomerForm]                                    │
│      ├──► [PaymentMethodSelector]                           │
│      └──► [CardForm] / [NequiForm]                          │
│                │                                             │
│                ▼                                             │
│      [useUnifiedCheckout]                                   │
│                │                                             │
│                ├──► Validar datos                            │
│                ├──► Tokenizar (Wompi API)                    │
│                ├──► POST /api/orders/checkout               │
│                ├──► Poll /api/transactions/:id/status        │
│                └──► Mostrar resultado                        │
│                         │                                    │
│                         ▼                                    │
│              [SuccessModal] ──► [InvoiceModal]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Puntos Clave de la Arquitectura

### ✨ **Principios de Diseño**

1. 🧱 **Componentes Modulares** - Cada componente tiene una responsabilidad única
2. 🎣 **Custom Hooks** - Lógica reutilizable extraída en hooks
3. 🗃️ **State Management** - Redux para estado global, React state para local
4. 💾 **Persistencia** - localStorage para mantener carrito entre sesiones
5. 🔄 **Optimización** - Debouncing, lazy loading, memoización

### 🔒 **Seguridad**

- ✅ Tokenización de tarjetas antes de enviar al backend
- ✅ Validación en frontend y backend
- ✅ Variables de entorno para API keys
- ✅ HTTPS para producción

### 📱 **UX/UI**

- ✅ Responsive design
- ✅ Modo claro/oscuro
- ✅ Loading states
- ✅ Mensajes de error claros
- ✅ Feedback visual inmediato

---

## 🐛 Debugging

### **Logs útiles:**

```javascript
// Ver estado del carrito
console.log("Cart items:", store.getState().cart.items);

// Ver datos de checkout
console.log("Purchase data:", purchaseData);

// Ver respuesta de Wompi
console.log("Wompi response:", response);
```

### **Redux DevTools:**

Instala la extensión para inspeccionar acciones y estado:

- Ver cada `addItem`, `removeItem`, etc.
- Time-travel debugging

---

## 📚 Recursos Adicionales

- 📖 [React Docs](https://react.dev)
- ⚡ [Vite Guide](https://vitejs.dev/guide/)
- 🗃️ [Redux Toolkit](https://redux-toolkit.js.org)
- 💳 [Wompi API Docs](https://docs.wompi.co)

---

## 🤝 Contribuir

1. 🔧 Ejecuta tests antes de commit
2. 📝 Documenta cambios importantes
3. 🎨 Sigue las convenciones de código existentes
4. ✅ Asegúrate que el build funcione

---

**Última actualización:** Enero 2026
