import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { createOrder, getAcceptanceToken } from "@/services/checkoutService";
import "@/styles/components/cart-drawer.css";

// Wompi configuration
const WOMPI_PUBLIC_KEY = "pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7";
const WOMPI_INTEGRITY_KEY = "stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp";
const WOMPI_SCRIPT_URL = "https://checkout.wompi.co/widget.js";

// Helper function to generate integrity signature
async function generateIntegritySignature(reference, amountInCents, currency) {
  const concatenatedString = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(concatenatedString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function CartDrawer() {
  const {
    items,
    isOpen,
    totalPrice,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    emptyCart,
    closeCart,
  } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const drawerRef = useRef(null);
  const scriptLoaded = useRef(false);

  // Close cart when clicking outside
  useOnClickOutside(drawerRef, closeCart);

  // Load Wompi script
  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${WOMPI_SCRIPT_URL}"]`);

    if (existingScript || scriptLoaded.current) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      console.log("✅ Wompi script loaded");
      scriptLoaded.current = true;
    };
    script.onerror = () => {
      console.error("❌ Failed to load Wompi script");
    };

    document.body.appendChild(script);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle checkout - open Wompi widget directly
  const handleCheckout = async () => {
    if (!window.WidgetCheckout) {
      alert("Payment system is loading. Please try again in a moment.");
      return;
    }

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate total
      const subtotal = totalPrice;
      const shipping = totalPrice >= 99 ? 0 : 9.99;
      const total = subtotal + shipping;

      // Create order in backend
      const orderData = {
        customer_email: "cliente@example.com",
        customer_name: "Cliente de Prueba",
        customer_phone: "+573001234567",
        amount_in_cents: Math.round(total * 100),
        currency: "COP",
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        shipping_address: {
          address_line_1: "Calle 123",
          city: "Bogota",
          region: "Bogota DC",
          country: "CO",
          phone_number: "+573001234567",
        },
      };

      // Get acceptance token
      console.log("Getting acceptance token...");
      const tokenResponse = await getAcceptanceToken();
      console.log("Acceptance token response:", tokenResponse);

      if (!tokenResponse.success) {
        throw new Error("Failed to get acceptance token");
      }

      console.log("Creating order...", orderData);
      const response = await createOrder(orderData);
      console.log("Order created:", response);

      if (!response.success) {
        throw new Error(response.error || "Failed to create order");
      }

      // Open Wompi widget (signature not needed for programmatic widget)
      const checkout = new window.WidgetCheckout({
        currency: "COP",
        amountInCents: response.order.amount_in_cents,
        reference: response.order.reference,
        publicKey: WOMPI_PUBLIC_KEY,
        redirectUrl: `${window.location.origin}/order-confirmation`,
        customerData: {
          email: "cliente@example.com",
          fullName: "Cliente de Prueba",
          phoneNumber: "3001234567",
          phoneNumberPrefix: "+57",
        },
      });

      checkout.open((result) => {
        console.log("Payment result:", result);

        if (result.transaction?.status === "APPROVED") {
          emptyCart();
          closeCart();
          alert("Payment successful!");
        } else {
          alert(`Payment status: ${result.transaction?.status || "Unknown"}`);
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

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="cart-drawer-backdrop"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Cart Drawer */}
      <div className="cart-drawer" role="dialog" aria-labelledby="cart-title" ref={drawerRef}>
        {/* Header */}
        <div className="cart-drawer-header">
          <h2 id="cart-title" className="cart-drawer-title">
            Your Cart
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X className="cart-drawer-close-icon" />
          </Button>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="cart-drawer-empty">
            <div className="cart-drawer-empty-icon-wrapper">
              <ShoppingBag className="cart-drawer-empty-icon" />
            </div>
            <p className="cart-drawer-empty-text">Your cart is empty</p>
            <Button onClick={closeCart}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="cart-drawer-items">
              <div className="cart-drawer-items-list">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
                    {/* Item Image */}
                    <div className="cart-item-image-wrapper">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="cart-item-image"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="cart-item-details">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <p className="cart-item-price">${item.price}</p>

                      {/* Quantity Controls */}
                      <div className="cart-item-actions">
                        <Button
                          variant="outline"
                          size="icon"
                          className="cart-item-quantity-btn"
                          onClick={() => decrementQuantity(item.id)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="cart-item-quantity-icon" />
                        </Button>

                        <span className="cart-item-quantity">
                          {item.quantity}
                        </span>

                        <Button
                          variant="outline"
                          size="icon"
                          className="cart-item-quantity-btn"
                          onClick={() => incrementQuantity(item.id)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="cart-item-quantity-icon" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="cart-item-remove"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with Totals */}
            <div className="cart-drawer-footer">
              {/* Subtotal */}
              <div className="cart-drawer-subtotal">
                <span className="cart-drawer-subtotal-label">Subtotal</span>
                <span className="cart-drawer-subtotal-value">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Shipping */}
              <div className="cart-drawer-shipping">
                <span>Shipping</span>
                <span>{totalPrice >= 99 ? "Free" : "$9.99"}</span>
              </div>

              {/* Total */}
              <div className="cart-drawer-total">
                <span>Total</span>
                <span>
                  ${(totalPrice + (totalPrice >= 99 ? 0 : 9.99)).toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <Button
                className="cart-drawer-checkout-btn"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Checkout"}
              </Button>

              <Button
                variant="outline"
                className="cart-drawer-clear-btn"
                onClick={emptyCart}
              >
                Clear Cart
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
