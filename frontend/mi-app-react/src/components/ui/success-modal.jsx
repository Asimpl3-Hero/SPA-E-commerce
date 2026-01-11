import { useEffect, useState } from "react";
import "@/styles/components/success-modal.css";

/**
 * Success Modal Component
 * CTA modal shown after successful payment
 */
export const SuccessModal = ({
  isOpen,
  onClose,
  orderReference,
  onViewInvoice,
  onContinueShopping,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const handleViewInvoice = () => {
    // Call callback first before closing
    if (onViewInvoice) onViewInvoice();
    // Then close this modal
    handleClose();
  };

  const handleContinueShopping = () => {
    // Call callback first before closing
    if (onContinueShopping) onContinueShopping();
    // Then close this modal
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`success-modal-overlay ${isClosing ? "closing" : ""}`}>
      <div className={`success-modal ${isClosing ? "closing" : ""}`}>
        {/* Success Icon */}
        <div className="success-modal-icon-wrapper">
          <svg
            className="success-modal-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="success-modal-content">
          <h2 className="success-modal-title">¡Pago Exitoso!</h2>
          <p className="success-modal-message">
            Tu orden ha sido procesada correctamente.
          </p>
          <div className="success-modal-order">
            <span className="success-modal-order-label">Número de Orden:</span>
            <span className="success-modal-order-number">{orderReference}</span>
          </div>
          <p className="success-modal-submessage">
            Te enviaremos un correo de confirmación con los detalles de tu
            compra.
          </p>
        </div>

        {/* Actions */}
        <div className="success-modal-actions">
          <button
            className="success-modal-btn success-modal-btn-secondary"
            onClick={handleViewInvoice}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ver Factura
          </button>
          <button
            className="success-modal-btn success-modal-btn-primary"
            onClick={handleContinueShopping}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
};
