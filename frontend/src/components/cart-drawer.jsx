import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { SuccessModal } from "@/components/ui/success-modal";
import { InvoiceModal } from "@/components/ui/invoice-modal";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { CheckoutModal } from "@/components/checkout-modal";
import { formatCurrency } from "@/utils/formatters";
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
    getCartSummary,
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    orderReference: "",
  });
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    data: null,
  });
  const [lastPurchaseData, setLastPurchaseData] = useState(null);

  console.log('🛒 CartDrawer render - lastPurchaseData:', lastPurchaseData);
  console.log('🛒 CartDrawer render - invoiceModal:', invoiceModal);
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  const drawerRef = useRef(null);

  // Close cart when clicking outside (but not when checkout modal is open)
  useOnClickOutside(drawerRef, () => {
    if (!isCheckoutOpen) {
      closeCart();
    }
  });

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle checkout - open checkout modal
  const handleCheckout = () => {
    if (items.length === 0) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "Carrito Vacío",
        message: "Tu carrito está vacío. Agrega productos antes de proceder al pago.",
      });
      return;
    }

    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (reference, purchaseData) => {
    console.log('🎯 handleCheckoutSuccess called with:', { reference, purchaseData });

    // Close checkout modal
    setIsCheckoutOpen(false);

    // Clear cart
    emptyCart();

    // Save purchase data for invoice
    const invoiceData = {
      orderReference: reference,
      date: new Date().toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      items: purchaseData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      customer: {
        name: purchaseData.customerData.name,
        email: purchaseData.customerData.email,
        phone: purchaseData.customerData.phone,
        address: purchaseData.customerData.address || 'N/A',
      },
      payment: {
        method: purchaseData.paymentMethod === 'CARD' ? 'Tarjeta de Crédito' : 'Nequi',
        reference: reference,
        last4: purchaseData.cardData?.number?.slice(-4) || null,
      },
      summary: {
        subtotal: purchaseData.summary.subtotal,
        iva: purchaseData.summary.iva,
        shipping: purchaseData.summary.shipping,
        total: purchaseData.summary.total,
      },
    };

    console.log('📄 Invoice data created:', invoiceData);
    setLastPurchaseData(invoiceData);

    // Show success modal
    setSuccessModal({
      isOpen: true,
      orderReference: reference,
    });
  };

  const handleViewInvoice = () => {
    console.log('👁️ handleViewInvoice called from CartDrawer');
    console.log('📦 lastPurchaseData:', lastPurchaseData);
    console.log('🔍 invoiceModal state before:', invoiceModal);

    if (!lastPurchaseData) {
      console.error('❌ No purchase data available!');
      return;
    }

    // Close success modal first
    setSuccessModal({ isOpen: false, orderReference: "" });

    // Use a small delay to ensure success modal closes before opening invoice
    setTimeout(() => {
      console.log('🚀 Opening invoice modal with data:', lastPurchaseData);
      setInvoiceModal({
        isOpen: true,
        data: lastPurchaseData,
      });
    }, 200);
  };

  const handleContinueShopping = () => {
    setSuccessModal({ isOpen: false, orderReference: "" });
    closeCart();
  };

  const handleAlertClose = () => {
    setAlert({ ...alert, isOpen: false });
  };

  if (!isOpen) return null;

  const summary = getCartSummary();

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
            Tu Carrito
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            aria-label="Cerrar carrito"
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
            <p className="cart-drawer-empty-text">Tu carrito está vacío</p>
            <Button onClick={closeCart}>
              Continuar Comprando
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
                      <p className="cart-item-price">{formatCurrency(item.price)}</p>

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
                          Eliminar
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
                  {formatCurrency(summary.subtotal)}
                </span>
              </div>

              {/* IVA */}
              <div className="cart-drawer-shipping">
                <span>IVA (19%)</span>
                <span>{formatCurrency(summary.iva)}</span>
              </div>

              {/* Shipping */}
              <div className="cart-drawer-shipping">
                <span>Envío</span>
                <span>{summary.shipping === 0 ? "Gratis" : formatCurrency(summary.shipping)}</span>
              </div>

              {/* Total */}
              <div className="cart-drawer-total">
                <span>Total</span>
                <span>
                  {formatCurrency(summary.total)}
                </span>
              </div>

              {/* Action Buttons */}
              <Button
                className="cart-drawer-checkout-btn"
                size="lg"
                onClick={handleCheckout}
              >
                Pagar
              </Button>

              <Button
                variant="outline"
                className="cart-drawer-clear-btn"
                onClick={emptyCart}
              >
                Vaciar Carrito
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Alert Component */}
      <Alert
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={handleAlertClose}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        orderReference={successModal.orderReference}
        onViewInvoice={handleViewInvoice}
        onContinueShopping={handleContinueShopping}
        onClose={() => setSuccessModal({ isOpen: false, orderReference: "" })}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        invoiceData={invoiceModal.data}
        onClose={() => {
          setInvoiceModal({ isOpen: false, data: null });
          closeCart();
        }}
      />
    </>
  );
}
