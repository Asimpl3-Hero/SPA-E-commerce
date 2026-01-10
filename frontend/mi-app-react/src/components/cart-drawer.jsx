import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useToggle } from "@/hooks/useToggle";
import { CheckoutModal } from "./checkout-modal";
import "@/styles/components/cart-drawer.css";

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

  const [isCheckoutOpen, toggleCheckout] = useToggle(false);
  const drawerRef = useRef(null);

  // Close cart when clicking outside
  useOnClickOutside(drawerRef, closeCart);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
                onClick={toggleCheckout}
              >
                Checkout
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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={toggleCheckout}
        onSuccess={(orderId) => {
          console.log('Order created:', orderId);
          toggleCheckout();
          closeCart();
          // TODO: Navigate to order confirmation page
          // navigate(`/order-confirmation/${orderId}`);
        }}
      />
    </>
  );
}
