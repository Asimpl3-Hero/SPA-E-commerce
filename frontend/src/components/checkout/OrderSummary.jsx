import { formatCurrency } from "@/utils/formatters";

/**
 * OrderSummary Component
 * Displays the order items and pricing summary
 */
export const OrderSummary = ({ items, summary }) => {
  return (
    <section className="checkout-section checkout-summary">
      <h3>Resumen del Pedido</h3>
      <div className="checkout-summary-items">
        {items.map((item) => (
          <div key={item.id} className="checkout-summary-item">
            <img
              src={item.image}
              alt={item.name}
              className="checkout-summary-item-image"
            />
            <div className="checkout-summary-item-details">
              <span className="checkout-summary-item-name">{item.name}</span>
              <span className="checkout-summary-item-quantity">
                Cant: {item.quantity}
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
          <span>Envío</span>
          <span>
            {summary.shipping === 0 ? "GRATIS" : formatCurrency(summary.shipping)}
          </span>
        </div>
        <div className="checkout-summary-row">
          <span>IVA (19%)</span>
          <span>{formatCurrency(summary.iva)}</span>
        </div>
        <div className="checkout-summary-row checkout-summary-total">
          <span>Total</span>
          <span>{formatCurrency(summary.total)}</span>
        </div>
      </div>
    </section>
  );
};
