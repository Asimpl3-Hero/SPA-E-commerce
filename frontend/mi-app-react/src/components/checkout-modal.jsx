import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/formatters";
import { createOrder } from "@/services/checkoutService";
import { Button } from "./ui/button";
import { Alert } from "./ui/alert";
import "@/styles/components/checkout-modal.css";

// Wompi configuration
const WOMPI_API_URL = "https://api-sandbox.co.uat.wompi.dev/v1";
const WOMPI_PUBLIC_KEY = "pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7";

/**
 * CheckoutModal Component
 * Modal for checkout using Wompi's direct API (custom form)
 */
export const CheckoutModal = ({ isOpen, onClose, onSuccess }) => {
  const { items, getCartSummary, emptyCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [error, setError] = useState(null);

  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState("CARD"); // CARD or NEQUI

  // Card form state
  const [cardData, setCardData] = useState({
    number: "",
    cvc: "",
    exp_month: "",
    exp_year: "",
    card_holder: "",
  });

  // Card type detection
  const [cardType, setCardType] = useState(null);

  // Nequi form state
  const [nequiPhone, setNequiPhone] = useState("");

  // Customer form state
  const [customerData, setCustomerData] = useState({
    email: "",
    name: "",
    phone: "",
  });

  const summary = getCartSummary();
  const hasItems = items.length > 0;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  // Detect card type based on card number
  const detectCardType = (number) => {
    const cleanNumber = number.replace(/\s/g, "");

    if (/^4/.test(cleanNumber)) {
      return { type: "visa", name: "Visa" };
    } else if (/^5[1-5]/.test(cleanNumber) || /^2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)/.test(cleanNumber)) {
      return { type: "mastercard", name: "Mastercard" };
    } else if (/^3[47]/.test(cleanNumber)) {
      return { type: "amex", name: "American Express" };
    } else if (/^6(?:011|5)/.test(cleanNumber)) {
      return { type: "discover", name: "Discover" };
    } else if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) {
      return { type: "diners", name: "Diners Club" };
    }

    return null;
  };

  // Tokenize card using Wompi API
  const tokenizeCard = async () => {
    try {
      // Ensure exp_month is always 2 digits with leading zero
      const formattedMonth = cardData.exp_month.padStart(2, '0');

      const response = await fetch(`${WOMPI_API_URL}/tokens/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${WOMPI_PUBLIC_KEY}`,
        },
        body: JSON.stringify({
          number: cardData.number.replace(/\s/g, ""),
          cvc: cardData.cvc,
          exp_month: formattedMonth,
          exp_year: cardData.exp_year,
          card_holder: cardData.card_holder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Tokenization error:", data);
        throw new Error(data.error?.reason || data.error?.messages?.join(", ") || "Failed to tokenize card");
      }

      return data.data.id;
    } catch (error) {
      console.error("Tokenization request failed:", error);
      throw error;
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!customerData.email || !customerData.name || !customerData.phone) {
      setError("Please fill in all customer information");
      return false;
    }

    if (paymentMethod === "CARD") {
      if (!cardData.number || !cardData.cvc || !cardData.exp_month || !cardData.exp_year || !cardData.card_holder) {
        setError("Please fill in all card information");
        return false;
      }

      const cardNumber = cardData.number.replace(/\s/g, "");
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        setError("Invalid card number");
        return false;
      }

      if (cardData.cvc.length < 3 || cardData.cvc.length > 4) {
        setError("Invalid CVC");
        return false;
      }
    } else if (paymentMethod === "NEQUI") {
      if (!nequiPhone) {
        setError("Please enter your Nequi phone number");
        return false;
      }

      const cleanPhone = nequiPhone.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        setError("Nequi phone number must be 10 digits");
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Processing payment...");

    try {
      let paymentMethodData;

      if (paymentMethod === "CARD") {
        // Step 1: Tokenize card with Wompi
        setProcessingMessage("Tokenizing card...");
        const cardToken = await tokenizeCard();

        paymentMethodData = {
          type: "CARD",
          token: cardToken,
        };
      } else if (paymentMethod === "NEQUI") {
        // For Nequi, send phone number directly
        paymentMethodData = {
          type: "NEQUI",
          phone_number: nequiPhone.replace(/\D/g, ""),
        };
      }

      // Step 2: Create order in backend with payment info
      setProcessingMessage("Creating order...");
      const orderData = {
        customer_email: customerData.email,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        amount_in_cents: Math.round(summary.total * 100),
        currency: "COP",
        payment_method: paymentMethodData,
        items: items.map((item) => ({
          product_id: item.id, // Use product_id instead of id for backend
          name: item.name,
          price_at_purchase: Math.round(item.price * 100), // Price in cents
          quantity: item.quantity,
        })),
        shipping_address: {
          address_line_1: "Calle 123",
          city: "Bogota",
          region: "Bogota DC",
          country: "CO",
          phone_number: customerData.phone,
        },
      };

      const response = await createOrder(orderData);

      if (!response.success) {
        throw new Error(response.error || "Failed to create order");
      }

      // Step 3: Poll transaction status if transaction was created
      if (response.transaction && response.transaction.id) {
        const transactionId = response.transaction.id;

        try {
          setProcessingMessage("Verifying payment status...");
          const statusResponse = await fetch(
            `http://localhost:4567/api/checkout/transaction-status/${transactionId}`
          );
          const statusData = await statusResponse.json();

          if (statusData.success) {
            const transactionStatus = statusData.transaction.status;

            if (transactionStatus === "APPROVED") {
              // Payment approved
              emptyCart();
              setAlert({
                isOpen: true,
                type: "success",
                title: "¡Pago Exitoso!",
                message: `Tu orden ${response.order.reference} ha sido procesada correctamente. Recibirás un correo de confirmación pronto.`
              });

              // Close modal after showing success alert
              setTimeout(() => {
                if (onSuccess) {
                  onSuccess(response.order.reference);
                }
                handleClose();
              }, 3000);
            } else if (transactionStatus === "DECLINED") {
              setAlert({
                isOpen: true,
                type: "error",
                title: "Pago Rechazado",
                message: "Tu pago fue rechazado. Por favor, intenta con otro método de pago o tarjeta."
              });
            } else if (transactionStatus === "ERROR") {
              setAlert({
                isOpen: true,
                type: "error",
                title: "Error en el Pago",
                message: "Ocurrió un error al procesar tu pago. Por favor, intenta nuevamente."
              });
            } else if (transactionStatus === "PENDING") {
              setAlert({
                isOpen: true,
                type: "warning",
                title: "Pago en Proceso",
                message: "Tu pago está tomando más tiempo del esperado. Verifica el estado de tu orden más tarde."
              });
            }
          } else {
            throw new Error("Failed to verify payment status");
          }
        } catch (pollingError) {
          console.error("Polling error:", pollingError);
          throw new Error(pollingError.message || "Failed to verify payment status");
        }
      } else {
        // No transaction ID, order created without payment
        emptyCart();
        if (onSuccess) {
          onSuccess(response.order.reference);
        }
        handleClose();
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setAlert({
        isOpen: true,
        type: "error",
        title: "Error en el Proceso",
        message: error.message || "No se pudo procesar el pago. Por favor, intenta nuevamente."
      });
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  if (!isOpen) return null;

  if (!hasItems) {
    return (
      <div className="checkout-modal-backdrop" onClick={handleClose}>
        <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
          <div className="checkout-modal-header">
            <h2>Checkout</h2>
            <button
              className="checkout-modal-close"
              onClick={handleClose}
              aria-label="Close checkout"
            >
              ×
            </button>
          </div>
          <div className="checkout-modal-body">
            <div className="checkout-empty">
              <p>Your cart is empty. Add items to proceed with checkout.</p>
              <Button onClick={handleClose}>Continue Shopping</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-modal-backdrop" onClick={handleClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal-header">
          <h2>Checkout with Wompi</h2>
          <button
            className="checkout-modal-close"
            onClick={handleClose}
            aria-label="Close checkout"
          >
            ×
          </button>
        </div>

        <div className="checkout-modal-body">
          {/* Order Summary */}
          <section className="checkout-section checkout-summary">
            <h3>Order Summary</h3>
            <div className="checkout-summary-items">
              {items.map((item) => (
                <div key={item.id} className="checkout-summary-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="checkout-summary-item-image"
                  />
                  <div className="checkout-summary-item-details">
                    <span className="checkout-summary-item-name">
                      {item.name}
                    </span>
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
                    ? "FREE"
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

          {/* Customer Information */}
          <section className="checkout-section">
            <h3>Customer Information</h3>
            <div className="checkout-form">
              <div className="checkout-form-field">
                <label htmlFor="customer-name">Full Name *</label>
                <input
                  id="customer-name"
                  type="text"
                  placeholder="John Doe"
                  value={customerData.name}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, name: e.target.value })
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="checkout-form-field">
                <label htmlFor="customer-email">Email *</label>
                <input
                  id="customer-email"
                  type="email"
                  placeholder="john@example.com"
                  value={customerData.email}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, email: e.target.value })
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="checkout-form-field">
                <label htmlFor="customer-phone">Phone *</label>
                <input
                  id="customer-phone"
                  type="tel"
                  placeholder="+573001234567"
                  value={customerData.phone}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, phone: e.target.value })
                  }
                  disabled={isProcessing}
                />
              </div>
            </div>
          </section>

          {/* Payment Information */}
          <section className="checkout-section">
            <h3>Payment Information</h3>

            {/* Payment Method Selector */}
            <div className="payment-method-selector">
              <label>Select Payment Method *</label>
              <div className="payment-method-options">
                <button
                  type="button"
                  className={`payment-method-option ${paymentMethod === "CARD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("CARD")}
                  disabled={isProcessing}
                >
                  <div className="payment-method-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="#3b82f6" strokeWidth="1.5" fill="#eff6ff"/>
                      <path d="M2 9h20" stroke="#3b82f6" strokeWidth="1.5"/>
                      <rect x="5" y="13" width="6" height="2" rx="0.5" fill="#3b82f6"/>
                      <rect x="13" y="13" width="3" height="2" rx="0.5" fill="#3b82f6"/>
                    </svg>
                  </div>
                  <span className="payment-method-name">Credit/Debit Card</span>
                </button>
                <button
                  type="button"
                  className={`payment-method-option ${paymentMethod === "NEQUI" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("NEQUI")}
                  disabled={isProcessing}
                >
                  <div className="payment-method-icon nequi-logo">
                    <img
                      src="https://www.svgrepo.com/show/518153/nequi-colombia.svg"
                      alt="Nequi"
                      width="48"
                      height="48"
                      onError={(e) => {
                        // Fallback to colored square with N if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
                      <rect width="48" height="48" rx="8" fill="#CA0080"/>
                      <text x="24" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle">
                        N
                      </text>
                    </svg>
                  </div>
                  <span className="payment-method-name">Nequi</span>
                </button>
              </div>
            </div>

            {/* Card Payment Fields */}
            {paymentMethod === "CARD" && (
              <>
                <div className="checkout-form">
                  <div className="checkout-form-field">
                    <label htmlFor="card-number">
                      Card Number * {cardType && <span className="card-type-badge">{cardType.name}</span>}
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardData.number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                        setCardData({ ...cardData, number: formatted });

                        // Detect card type
                        const detected = detectCardType(value);
                        setCardType(detected);
                      }}
                      maxLength="19"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="checkout-form-field">
                    <label htmlFor="card-holder">Card Holder *</label>
                    <input
                      id="card-holder"
                      type="text"
                      placeholder="JOHN DOE"
                      value={cardData.card_holder}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          card_holder: e.target.value.toUpperCase(),
                        })
                      }
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="checkout-form-row">
                    <div className="checkout-form-field">
                      <label htmlFor="exp-month">Exp. Month *</label>
                      <input
                        id="exp-month"
                        type="text"
                        placeholder="MM"
                        value={cardData.exp_month}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                            setCardData({ ...cardData, exp_month: value });
                          }
                        }}
                        maxLength="2"
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="checkout-form-field">
                      <label htmlFor="exp-year">Exp. Year *</label>
                      <input
                        id="exp-year"
                        type="text"
                        placeholder="YY"
                        value={cardData.exp_year}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setCardData({ ...cardData, exp_year: value });
                        }}
                        maxLength="2"
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="checkout-form-field">
                      <label htmlFor="cvc">CVC *</label>
                      <input
                        id="cvc"
                        type="text"
                        placeholder="123"
                        value={cardData.cvc}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setCardData({ ...cardData, cvc: value });
                        }}
                        maxLength="4"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>

                <div className="checkout-test-cards">
                  <p className="checkout-test-cards-title">Test Cards (Sandbox):</p>
                  <p className="checkout-test-cards-info">
                    Card: <strong>4242 4242 4242 4242</strong> | CVC: Any 3 digits | Exp: Any future date
                  </p>
                </div>
              </>
            )}

            {/* Nequi Payment Fields */}
            {paymentMethod === "NEQUI" && (
              <>
                <div className="checkout-form">
                  <div className="checkout-form-field">
                    <label htmlFor="nequi-phone">Nequi Phone Number *</label>
                    <input
                      id="nequi-phone"
                      type="tel"
                      placeholder="3991111111"
                      value={nequiPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) {
                          setNequiPhone(value);
                        }
                      }}
                      maxLength="10"
                      disabled={isProcessing}
                    />
                    <small style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                      Enter your 10-digit Nequi phone number
                    </small>
                  </div>
                </div>

                <div className="checkout-test-cards">
                  <p className="checkout-test-cards-title">Test Nequi Numbers (Sandbox):</p>
                  <p className="checkout-test-cards-info">
                    Approved: <strong>3991111111</strong> | Declined: <strong>3992222222</strong>
                  </p>
                </div>
              </>
            )}
          </section>

          {/* Error Display */}
          {error && (
            <div className="checkout-error">
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="checkout-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? processingMessage || "Processing Payment..." : "Complete Payment"}
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Component */}
      <Alert
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </div>
  );
};
