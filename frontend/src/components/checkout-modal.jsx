import { useCart } from "@/hooks/useCart";
import { useUnifiedCheckout } from "@/hooks/useUnifiedCheckout";
import { Button } from "./ui/button";
import { Alert } from "./ui/alert";
import { OrderSummary } from "./checkout/OrderSummary";
import { CustomerForm } from "./checkout/CustomerForm";
import { DeliveryForm } from "./checkout/DeliveryForm";
import { PaymentMethodSelector } from "./checkout/PaymentMethodSelector";
import { CardForm } from "./checkout/CardForm";
import { NequiForm } from "./checkout/NequiForm";
import "@/styles/components/checkout-modal.css";

/**
 * CheckoutModal Component
 * Modal for checkout with unified payment gateway support
 */
export const CheckoutModal = ({ isOpen, onClose, onSuccess, gateway = "wompi" }) => {
  const { items, getCartSummary, emptyCart } = useCart();
  const summary = getCartSummary();
  const hasItems = items.length > 0;

  // Use unified checkout hook - supports multiple payment gateways
  const { state, actions } = useUnifiedCheckout({
    gateway,
    items,
    getCartSummary,
    emptyCart,
    onSuccess,
  });

  const handleClose = () => {
    actions.setError(null);
    onClose();
  };

  if (!isOpen) return null;

  if (!hasItems) {
    return (
      <div className="checkout-modal-backdrop" onClick={handleClose}>
        <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
          <div className="checkout-modal-header">
            <h2>Pago</h2>
            <button
              className="checkout-modal-close"
              onClick={handleClose}
              aria-label="Cerrar pago"
            >
              ×
            </button>
          </div>
          <div className="checkout-modal-body">
            <div className="checkout-empty">
              <p>Tu carrito está vacío. Agrega productos para proceder con el pago.</p>
              <Button onClick={handleClose}>Continuar Comprando</Button>
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
          <h2>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                display: "inline-block",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            >
              <path
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                stroke="url(#gradient1)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="gradient1"
                  x1="3"
                  y1="3"
                  x2="21"
                  y2="21"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="hsl(var(--primary))" />
                  <stop offset="1" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            Pago Seguro
          </h2>
          <button
            className="checkout-modal-close"
            onClick={handleClose}
            aria-label="Cerrar pago"
          >
            ×
          </button>
        </div>

        <div className="checkout-modal-body">
          {/* Order Summary */}
          <OrderSummary items={items} summary={summary} />

          {/* Customer Information */}
          <CustomerForm
            customerData={state.customerData}
            setCustomerData={actions.setCustomerData}
            isProcessing={state.isProcessing}
          />

          {/* Delivery Address */}
          <DeliveryForm
            deliveryData={state.deliveryData}
            setDeliveryData={actions.setDeliveryData}
            isProcessing={state.isProcessing}
          />

          {/* Payment Information */}
          <section className="checkout-section">
            <h3>Información de Pago</h3>

            <PaymentMethodSelector
              paymentMethod={state.paymentMethod}
              setPaymentMethod={actions.setPaymentMethod}
              isProcessing={state.isProcessing}
            />

            {state.paymentMethod === "CARD" && (
              <CardForm
                cardData={state.cardData}
                setCardData={actions.setCardData}
                cardType={state.cardType}
                onCardNumberChange={actions.handleCardNumberChange}
                isProcessing={state.isProcessing}
              />
            )}

            {state.paymentMethod === "NEQUI" && (
              <NequiForm
                nequiPhone={state.nequiPhone}
                setNequiPhone={actions.setNequiPhone}
                isProcessing={state.isProcessing}
              />
            )}
          </section>

          {/* Error Display */}
          {state.error && (
            <div className="checkout-error">
              <p>{state.error}</p>
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              borderTop: "1px solid hsl(var(--border))",
              paddingTop: "var(--space-4)",
              marginTop: "var(--space-4)",
            }}
          >
            <div className="checkout-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={state.isProcessing}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={actions.handleCheckout}
                disabled={state.isProcessing}
                style={{
                  position: "relative",
                  minWidth: "200px",
                }}
              >
                {state.isProcessing ? (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        display: "inline-block",
                        marginRight: "8px",
                        animation: "spin 1s linear infinite",
                      }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        d="M12 2a10 10 0 0110 10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                    {state.processingMessage || "Procesando..."}
                  </>
                ) : (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ display: "inline-block", marginRight: "8px" }}
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                        fill="currentColor"
                      />
                    </svg>
                    Completar Pago
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Component */}
      <Alert
        isOpen={state.alert.isOpen}
        type={state.alert.type}
        title={state.alert.title}
        message={state.alert.message}
        onClose={() =>
          actions.setAlert({ ...state.alert, isOpen: false })
        }
      />
    </div>
  );
};
