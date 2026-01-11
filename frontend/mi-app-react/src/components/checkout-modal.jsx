import { useEffect, useState, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/formatters";
import { createOrder } from "@/services/checkoutService";
import { Button } from "./ui/button";
import "@/styles/components/checkout-modal.css";

// Wompi configuration
const WOMPI_PUBLIC_KEY = "pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7";
const WOMPI_SCRIPT_URL = "https://checkout.wompi.co/widget.js";

/**
 * CheckoutModal Component
 * Modal for checkout using Wompi's preconstruited widget
 */
export const CheckoutModal = ({ isOpen, onClose, onSuccess }) => {
  const { items, getCartSummary, emptyCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderReference, setOrderReference] = useState(null);
  const checkoutRef = useRef(null);
  const scriptLoaded = useRef(false);

  const summary = getCartSummary();
  const hasItems = items.length > 0;

  console.log("CheckoutModal render - isOpen:", isOpen, "hasItems:", hasItems);

  // Wrapper for onClose to track when it's called
  const handleClose = () => {
    console.log("🔴 Modal closing - onClose called");
    console.trace("Close called from:");
    onClose();
  };

  // Load Wompi script
  useEffect(() => {
    console.log("useEffect: Checking if Wompi script needs to be loaded...");

    // Check if script already exists in DOM
    const existingScript = document.querySelector(`script[src="${WOMPI_SCRIPT_URL}"]`);

    if (existingScript) {
      console.log("useEffect: Wompi script already exists in DOM");
      scriptLoaded.current = true;
      return;
    }

    if (scriptLoaded.current) {
      console.log("useEffect: Script already loaded");
      return;
    }

    const script = document.createElement("script");
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      console.log("✅ Wompi script loaded successfully");
      console.log("window.WidgetCheckout available:", !!window.WidgetCheckout);
      scriptLoaded.current = true;
    };
    script.onerror = (error) => {
      console.error("❌ Failed to load Wompi script:", error);
    };

    console.log("Appending Wompi script to document body...");
    document.body.appendChild(script);

    // DON'T remove the script on cleanup - keep it in DOM
    // return () => {
    //   if (script.parentNode) {
    //     script.parentNode.removeChild(script);
    //   }
    // };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCheckout = async () => {
    console.log("handleCheckout called");
    console.log("window.WidgetCheckout:", window.WidgetCheckout);

    if (!window.WidgetCheckout) {
      console.error("WidgetCheckout not loaded");
      alert("Payment system is loading. Please try again in a moment.");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create order in backend
      const orderData = {
        customer_email: "cliente@example.com", // TODO: Get from user input
        customer_name: "Cliente de Prueba", // TODO: Get from user input
        customer_phone: "+573001234567", // TODO: Get from user input
        amount_in_cents: Math.round(summary.total * 100), // Convert to cents
        currency: "COP",
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        shipping_address: {
          address_line_1: "Calle 123", // TODO: Get from user input
          city: "Bogota",
          region: "Bogota DC",
          country: "CO",
          phone_number: "+573001234567",
        },
      };

      console.log("Creating order with data:", orderData);
      const response = await createOrder(orderData);
      console.log("Order response:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to create order");
      }

      const reference = response.order.reference;
      setOrderReference(reference);

      // Step 2: Initialize Wompi checkout widget
      const checkoutConfig = {
        currency: "COP",
        amountInCents: response.order.amount_in_cents,
        reference: reference,
        publicKey: WOMPI_PUBLIC_KEY,
        redirectUrl: `${window.location.origin}/order-confirmation`,
      };

      console.log("Initializing Wompi widget with config:", checkoutConfig);
      const checkout = new window.WidgetCheckout(checkoutConfig);

      // Step 3: Open Wompi widget
      console.log("Opening Wompi widget...");
      checkout.open((result) => {
        console.log("Wompi widget callback result:", result);
        const transaction = result.transaction;
        console.log("Transaction result:", transaction);

        if (transaction.status === "APPROVED") {
          // Clear cart and close modal
          emptyCart();
          if (onSuccess) {
            onSuccess(reference);
          }
          handleClose();
        } else {
          alert(`Payment status: ${transaction.status}`);
        }

        setIsProcessing(false);
      });
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to process checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  if (!hasItems) {
    return (
      <div className="checkout-modal-backdrop">
        <div className="checkout-modal">
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
    <div className="checkout-modal-backdrop">
      <div
        className="checkout-modal"
        ref={checkoutRef}
      >
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

          {/* Payment Info */}
          <section className="checkout-section">
            <div className="checkout-payment-info">
              <p className="checkout-payment-description">
                Click "Proceed to Payment" to complete your purchase securely
                with Wompi.
              </p>
              <p className="checkout-payment-note">
                You'll be able to enter your payment and shipping information in
                the next step.
              </p>
            </div>
          </section>

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
              onClick={(e) => {
                console.log("🔵 Button clicked!");
                e.preventDefault();
                e.stopPropagation();
                handleCheckout();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
