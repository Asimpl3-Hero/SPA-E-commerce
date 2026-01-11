import { useEffect, useState } from "react";
import "@/styles/components/invoice-modal.css";

/**
 * Invoice Modal Component
 * Displays detailed invoice information after purchase
 */
export const InvoiceModal = ({
  isOpen,
  onClose,
  invoiceData,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  console.log('🧾 InvoiceModal rendered with:', { isOpen, invoiceData });

  useEffect(() => {
    console.log('🔄 InvoiceModal useEffect - isOpen:', isOpen);
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log("Download invoice as PDF");
  };

  if (!isVisible || !invoiceData) {
    console.log('❌ InvoiceModal early return:', { isVisible, invoiceData });
    return null;
  }

  console.log('✅ InvoiceModal rendering content');

  const {
    orderReference,
    date,
    items,
    customer,
    payment,
    summary,
  } = invoiceData;

  return (
    <div
      className={`invoice-modal-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`invoice-modal ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="invoice-modal-header">
          <div className="invoice-header-content">
            <h2 className="invoice-modal-title">Factura de Compra</h2>
            <p className="invoice-order-ref">Orden #{orderReference}</p>
          </div>
          <button
            className="invoice-modal-close"
            onClick={handleClose}
            aria-label="Close invoice"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="invoice-modal-body">
          {/* Invoice Info */}
          <div className="invoice-section">
            <div className="invoice-info-grid">
              <div className="invoice-info-item">
                <span className="invoice-info-label">Fecha</span>
                <span className="invoice-info-value">{date}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Método de Pago</span>
                <span className="invoice-info-value">{payment.method}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Estado</span>
                <span className="invoice-status-badge invoice-status-approved">
                  Aprobado
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="invoice-section">
            <h3 className="invoice-section-title">Información del Cliente</h3>
            <div className="invoice-customer-grid">
              <div className="invoice-info-item">
                <span className="invoice-info-label">Nombre</span>
                <span className="invoice-info-value">{customer.name}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Email</span>
                <span className="invoice-info-value">{customer.email}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Teléfono</span>
                <span className="invoice-info-value">{customer.phone}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Dirección</span>
                <span className="invoice-info-value">{customer.address}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="invoice-section">
            <h3 className="invoice-section-title">Productos</h3>
            <div className="invoice-table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="invoice-item-name">{item.name}</td>
                      <td className="invoice-item-quantity">{item.quantity}</td>
                      <td className="invoice-item-price">
                        ${item.price.toLocaleString()}
                      </td>
                      <td className="invoice-item-total">
                        ${(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="invoice-section">
            <div className="invoice-summary">
              <div className="invoice-summary-row">
                <span className="invoice-summary-label">Subtotal</span>
                <span className="invoice-summary-value">
                  ${summary.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="invoice-summary-row">
                <span className="invoice-summary-label">IVA (19%)</span>
                <span className="invoice-summary-value">
                  ${summary.iva.toLocaleString()}
                </span>
              </div>
              <div className="invoice-summary-row">
                <span className="invoice-summary-label">Envío</span>
                <span className="invoice-summary-value">
                  {summary.shipping === 0 ? "Gratis" : `$${summary.shipping.toLocaleString()}`}
                </span>
              </div>
              <div className="invoice-summary-row invoice-summary-total">
                <span className="invoice-summary-label">Total</span>
                <span className="invoice-summary-value">
                  ${summary.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="invoice-section">
            <h3 className="invoice-section-title">Información de Pago</h3>
            <div className="invoice-payment-info">
              <div className="invoice-info-item">
                <span className="invoice-info-label">Referencia de Pago</span>
                <span className="invoice-info-value">{payment.reference}</span>
              </div>
              {payment.last4 && (
                <div className="invoice-info-item">
                  <span className="invoice-info-label">Tarjeta</span>
                  <span className="invoice-info-value">
                    •••• •••• •••• {payment.last4}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="invoice-footer-note">
            <p>Gracias por tu compra. Si tienes alguna pregunta, contáctanos.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="invoice-modal-actions">
          <button
            className="invoice-action-btn invoice-btn-secondary"
            onClick={handlePrint}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Imprimir
          </button>
          <button
            className="invoice-action-btn invoice-btn-primary"
            onClick={handleDownload}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
