/**
 * DeliveryForm Component
 * Form for delivery/shipping address information
 */
export const DeliveryForm = ({ deliveryData, setDeliveryData, isProcessing }) => {
  return (
    <section className="checkout-section">
      <h3>Dirección de Entrega</h3>
      <div className="checkout-form">
        <div className="checkout-form-field">
          <label htmlFor="delivery-address1">Dirección *</label>
          <input
            id="delivery-address1"
            type="text"
            placeholder="Calle 123 #45-67"
            value={deliveryData.address_line_1}
            onChange={(e) =>
              setDeliveryData({ ...deliveryData, address_line_1: e.target.value })
            }
            disabled={isProcessing}
          />
        </div>
        <div className="checkout-form-field">
          <label htmlFor="delivery-address2">Dirección adicional</label>
          <input
            id="delivery-address2"
            type="text"
            placeholder="Apartamento, oficina, etc. (opcional)"
            value={deliveryData.address_line_2}
            onChange={(e) =>
              setDeliveryData({ ...deliveryData, address_line_2: e.target.value })
            }
            disabled={isProcessing}
          />
        </div>
        <div className="checkout-form-row">
          <div className="checkout-form-field">
            <label htmlFor="delivery-city">Ciudad *</label>
            <input
              id="delivery-city"
              type="text"
              placeholder="Bogotá"
              value={deliveryData.city}
              onChange={(e) =>
                setDeliveryData({ ...deliveryData, city: e.target.value })
              }
              disabled={isProcessing}
            />
          </div>
          <div className="checkout-form-field">
            <label htmlFor="delivery-region">Departamento *</label>
            <input
              id="delivery-region"
              type="text"
              placeholder="Cundinamarca"
              value={deliveryData.region}
              onChange={(e) =>
                setDeliveryData({ ...deliveryData, region: e.target.value })
              }
              disabled={isProcessing}
            />
          </div>
        </div>
        <div className="checkout-form-row">
          <div className="checkout-form-field">
            <label htmlFor="delivery-postal">Código Postal</label>
            <input
              id="delivery-postal"
              type="text"
              placeholder="110111 (opcional)"
              value={deliveryData.postal_code}
              onChange={(e) =>
                setDeliveryData({ ...deliveryData, postal_code: e.target.value })
              }
              disabled={isProcessing}
            />
          </div>
          <div className="checkout-form-field">
            <label htmlFor="delivery-country">País</label>
            <select
              id="delivery-country"
              value={deliveryData.country}
              onChange={(e) =>
                setDeliveryData({ ...deliveryData, country: e.target.value })
              }
              disabled={isProcessing}
            >
              <option value="CO">Colombia</option>
            </select>
          </div>
        </div>
        <div className="checkout-form-field">
          <label htmlFor="delivery-notes">Notas de entrega</label>
          <textarea
            id="delivery-notes"
            placeholder="Instrucciones especiales para la entrega (opcional)"
            value={deliveryData.delivery_notes}
            onChange={(e) =>
              setDeliveryData({ ...deliveryData, delivery_notes: e.target.value })
            }
            disabled={isProcessing}
            rows={3}
          />
        </div>
      </div>
    </section>
  );
};
