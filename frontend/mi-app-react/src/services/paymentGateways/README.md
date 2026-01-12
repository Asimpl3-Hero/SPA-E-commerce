# Payment Gateway Architecture

## Overview

This directory contains a unified architecture for integrating multiple payment gateways in the application. The design follows the **Adapter Pattern** to provide a consistent interface across different payment providers.

## Architecture

```
paymentGateways/
├── BasePaymentGateway.js      # Abstract base class/interface
├── WompiGateway.js            # Wompi implementation
├── index.js                   # Exports
└── README.md                  # This file
```

## How It Works

### 1. Base Payment Gateway Interface

All payment gateways extend `BasePaymentGateway` and implement these methods:

```javascript
class BasePaymentGateway {
  async tokenize(paymentData)           // Tokenize payment method
  async processPayment(orderData)       // Process the payment
  async getPaymentStatus(transactionId) // Check payment status
  validate(paymentData)                 // Validate payment data
  getSupportedMethods()                 // Get supported methods
}
```

### 2. Gateway Implementations

Each payment provider has its own adapter:

#### Wompi Gateway

```javascript
import { WompiGateway } from '@/services/paymentGateways';

const wompi = new WompiGateway();
const methods = wompi.getSupportedMethods(); // ['CARD', 'NEQUI']
```

**Features:**
- Credit/Debit card tokenization
- Nequi integration
- Transaction status polling
- Card type detection (Visa, Mastercard, etc.)

### 3. Unified Checkout Hook

The `useUnifiedCheckout` hook provides a gateway-agnostic interface:

```javascript
import { useUnifiedCheckout } from '@/hooks/useUnifiedCheckout';

const { state, actions } = useUnifiedCheckout({
  gateway: 'wompi',  // or 'stripe', 'mercadopago', etc.
  items,
  getCartSummary,
  emptyCart,
  onSuccess,
});
```

## Usage Examples

### Basic Wompi Integration

```javascript
// In your checkout component
const { state, actions } = useUnifiedCheckout({
  gateway: 'wompi',
  items: cartItems,
  getCartSummary: () => ({ total: 1000 }),
  emptyCart: () => {},
  onSuccess: (orderRef) => console.log('Order:', orderRef),
});

// Access state
const {
  isProcessing,
  paymentMethod,
  cardData,
  supportedMethods,
} = state;

// Perform actions
actions.handleCheckout();
```

### Switching Payment Gateways

Simply change the `gateway` prop:

```javascript
// Use Wompi
<CheckoutModal gateway="wompi" />

// Use Stripe (when implemented)
<CheckoutModal gateway="stripe" />

// Use MercadoPago (when implemented)
<CheckoutModal gateway="mercadopago" />
```

## Adding a New Payment Gateway

### Step 1: Create Gateway Adapter

```javascript
// StripeGateway.js
import { BasePaymentGateway } from "./BasePaymentGateway";

export class StripeGateway extends BasePaymentGateway {
  constructor() {
    super({ /* config */ });
  }

  getSupportedMethods() {
    return ["CARD", "APPLE_PAY", "GOOGLE_PAY"];
  }

  async tokenize(cardData) {
    // Implement Stripe tokenization
  }

  async processPayment(orderData) {
    // Implement Stripe payment processing
  }

  async getPaymentStatus(transactionId) {
    // Implement Stripe status check
  }

  validate(paymentData) {
    // Implement Stripe validation
  }
}
```

### Step 2: Update Unified Hook

```javascript
// In useUnifiedCheckout.js
const [paymentGateway] = useState(() => {
  if (gateway === 'wompi') return new WompiGateway();
  if (gateway === 'stripe') return new StripeGateway();
  return null;
});
```

### Step 3: Export

```javascript
// In paymentGateways/index.js
export { StripeGateway } from "./StripeGateway";
```

## Benefits

### 1. **Separation of Concerns**
- Payment logic isolated from UI
- Each gateway has its own file
- Easy to test independently

### 2. **Extensibility**
- Add new gateways without touching existing code
- Consistent interface for all providers
- Gateway-specific features still accessible

### 3. **Maintainability**
- Clear structure
- Single responsibility principle
- Easy to locate and fix issues

### 4. **Flexibility**
- Switch gateways with a single prop
- Support multiple gateways in the same app
- A/B test different providers

### 5. **Type Safety**
- Clear contracts via base class
- Predictable method signatures
- Runtime validation

## Configuration

Payment gateway configurations are stored in environment variables:

```env
# Wompi
VITE_WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_xxx
VITE_WOMPI_SCRIPT_URL=https://checkout.wompi.co/widget.js

# Stripe (example)
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
VITE_STRIPE_API_VERSION=2023-10-16
```

## Testing

Each gateway can be tested independently:

```javascript
import { WompiGateway } from '@/services/paymentGateways';

describe('WompiGateway', () => {
  const gateway = new WompiGateway();

  test('tokenizes card correctly', async () => {
    const token = await gateway.tokenize({
      number: '4242424242424242',
      cvc: '123',
      exp_month: '12',
      exp_year: '25',
      card_holder: 'TEST USER',
    });
    expect(token).toBeDefined();
  });

  test('validates card data', () => {
    const result = gateway.validate({
      method: 'CARD',
      cardData: { /* incomplete */ },
    });
    expect(result.valid).toBe(false);
  });
});
```

## Migration Guide

### From Old Architecture

**Before:**
```javascript
import { useWompiCheckout } from '@/hooks/useWompiCheckout';
const { state, actions } = useWompiCheckout({ ... });
```

**After:**
```javascript
import { useUnifiedCheckout } from '@/hooks/useUnifiedCheckout';
const { state, actions } = useUnifiedCheckout({
  gateway: 'wompi',
  ...
});
```

The API remains the same, just specify the gateway!

## Future Enhancements

- [ ] Add Stripe integration
- [ ] Add MercadoPago integration
- [ ] Add PayPal integration
- [ ] Implement retry logic
- [ ] Add payment webhooks
- [ ] Support recurring payments
- [ ] Add 3D Secure support
- [ ] Implement refunds

## Support

For issues or questions about payment gateways, check:
- Wompi docs: https://docs.wompi.co
- This README
- `useUnifiedCheckout` hook documentation
