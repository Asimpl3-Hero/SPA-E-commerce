import { useEffect } from 'react';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCurrency } from '@/utils/formatters';
import { SHIPPING_METHODS } from '@/constants/config';
import { Input } from './ui/input';
import { Button } from './ui/button';
import './checkout-modal.css';

/**
 * CheckoutModal Component
 * Modal for guest checkout with form validation
 */
export const CheckoutModal = ({ isOpen, onClose, onSuccess }) => {
  const {
    formData,
    errors,
    isSubmitting,
    orderSuccess,
    orderId,
    updateField,
    submitCheckout,
    getOrderSummary,
    hasItems,
  } = useCheckout();

  const summary = getOrderSummary();

  // Handle successful order
  useEffect(() => {
    if (orderSuccess && orderId && onSuccess) {
      onSuccess(orderId);
      onClose();
    }
  }, [orderSuccess, orderId, onSuccess, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submitCheckout();

    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!hasItems) {
    return (
      <div className="checkout-modal-backdrop" onClick={handleBackdropClick}>
        <div className="checkout-modal">
          <div className="checkout-modal-header">
            <h2>Checkout</h2>
            <button
              className="checkout-modal-close"
              onClick={onClose}
              aria-label="Close checkout"
            >
              ×
            </button>
          </div>
          <div className="checkout-modal-body">
            <div className="checkout-empty">
              <p>Your cart is empty. Add items to proceed with checkout.</p>
              <Button onClick={onClose}>Continue Shopping</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-modal-backdrop" onClick={handleBackdropClick}>
      <div className="checkout-modal">
        <div className="checkout-modal-header">
          <h2>Checkout</h2>
          <button
            className="checkout-modal-close"
            onClick={onClose}
            aria-label="Close checkout"
          >
            ×
          </button>
        </div>

        <div className="checkout-modal-body">
          <form onSubmit={handleSubmit} className="checkout-form">
            {/* Contact Information */}
            <section className="checkout-section">
              <h3>Contact Information</h3>
              <div className="checkout-form-grid">
                <div className="checkout-form-field">
                  <label htmlFor="email">Email *</label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                    placeholder="your.email@example.com"
                    required
                  />
                  {errors.email && (
                    <span className="checkout-error">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="checkout-form-grid checkout-form-grid-2">
                <div className="checkout-form-field">
                  <label htmlFor="firstName">First Name *</label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="John"
                    required
                  />
                  {errors.firstName && (
                    <span className="checkout-error">{errors.firstName}</span>
                  )}
                </div>

                <div className="checkout-form-field">
                  <label htmlFor="lastName">Last Name *</label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Doe"
                    required
                  />
                  {errors.lastName && (
                    <span className="checkout-error">{errors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="checkout-form-grid">
                <div className="checkout-form-field">
                  <label htmlFor="phone">Phone Number *</label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={errors.phone ? 'error' : ''}
                    placeholder="(555) 123-4567"
                    required
                  />
                  {errors.phone && (
                    <span className="checkout-error">{errors.phone}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="checkout-section">
              <h3>Shipping Address</h3>
              <div className="checkout-form-grid">
                <div className="checkout-form-field">
                  <label htmlFor="address">Street Address *</label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className={errors.address ? 'error' : ''}
                    placeholder="123 Main St"
                    required
                  />
                  {errors.address && (
                    <span className="checkout-error">{errors.address}</span>
                  )}
                </div>
              </div>

              <div className="checkout-form-grid checkout-form-grid-2">
                <div className="checkout-form-field">
                  <label htmlFor="city">City *</label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className={errors.city ? 'error' : ''}
                    placeholder="New York"
                    required
                  />
                  {errors.city && (
                    <span className="checkout-error">{errors.city}</span>
                  )}
                </div>

                <div className="checkout-form-field">
                  <label htmlFor="state">State *</label>
                  <Input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className={errors.state ? 'error' : ''}
                    placeholder="NY"
                    required
                  />
                  {errors.state && (
                    <span className="checkout-error">{errors.state}</span>
                  )}
                </div>
              </div>

              <div className="checkout-form-grid checkout-form-grid-2">
                <div className="checkout-form-field">
                  <label htmlFor="zipCode">Zip Code *</label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    className={errors.zipCode ? 'error' : ''}
                    placeholder="10001"
                    required
                  />
                  {errors.zipCode && (
                    <span className="checkout-error">{errors.zipCode}</span>
                  )}
                </div>

                <div className="checkout-form-field">
                  <label htmlFor="country">Country *</label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className={errors.country ? 'error' : ''}
                    required
                  />
                  {errors.country && (
                    <span className="checkout-error">{errors.country}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section className="checkout-section">
              <h3>Shipping Method</h3>
              <div className="checkout-shipping-options">
                {Object.values(SHIPPING_METHODS).map((method) => (
                  <label
                    key={method.id}
                    className={`checkout-radio-option ${
                      formData.shippingMethod === method.id ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      checked={formData.shippingMethod === method.id}
                      onChange={(e) => updateField('shippingMethod', e.target.value)}
                    />
                    <div className="checkout-radio-content">
                      <div className="checkout-radio-label">
                        <span className="checkout-radio-name">{method.name}</span>
                        <span className="checkout-radio-price">
                          {formatCurrency(method.cost)}
                        </span>
                      </div>
                      <span className="checkout-radio-description">
                        Arrives in {method.days} business days
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Order Summary */}
            <section className="checkout-section checkout-summary">
              <h3>Order Summary</h3>
              <div className="checkout-summary-items">
                {summary.items.map((item) => (
                  <div key={item.id} className="checkout-summary-item">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="checkout-summary-item-image"
                    />
                    <div className="checkout-summary-item-details">
                      <span className="checkout-summary-item-name">{item.name}</span>
                      <span className="checkout-summary-item-quantity">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="checkout-summary-item-price">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-totals">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(summary.subtotal)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Shipping</span>
                  <span>
                    {summary.shipping === 0
                      ? 'FREE'
                      : formatCurrency(summary.shipping)}
                  </span>
                </div>
                <div className="checkout-summary-row">
                  <span>Tax</span>
                  <span>{formatCurrency(summary.tax)}</span>
                </div>
                <div className="checkout-summary-row checkout-summary-total">
                  <span>Total</span>
                  <span>{formatCurrency(summary.total)}</span>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="checkout-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
