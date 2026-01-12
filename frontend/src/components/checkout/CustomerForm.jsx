/**
 * CustomerForm Component
 * Form for customer contact information
 */
export const CustomerForm = ({ customerData, setCustomerData, isProcessing }) => {
  return (
    <section className="checkout-section">
      <h3>Información del Cliente</h3>
      <div className="checkout-form">
        <div className="checkout-form-field">
          <label htmlFor="customer-name">Nombre Completo *</label>
          <input
            id="customer-name"
            type="text"
            placeholder="Juan Pérez"
            value={customerData.name}
            onChange={(e) =>
              setCustomerData({ ...customerData, name: e.target.value })
            }
            disabled={isProcessing}
          />
        </div>
        <div className="checkout-form-field">
          <label htmlFor="customer-email">Correo Electrónico *</label>
          <input
            id="customer-email"
            type="email"
            placeholder="juan@ejemplo.com"
            value={customerData.email}
            onChange={(e) =>
              setCustomerData({ ...customerData, email: e.target.value })
            }
            disabled={isProcessing}
          />
        </div>
        <div className="checkout-form-field">
          <label htmlFor="customer-phone">Teléfono *</label>
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
  );
};
