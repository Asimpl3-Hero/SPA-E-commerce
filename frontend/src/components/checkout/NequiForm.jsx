import { WOMPI_TEST_DATA } from "@/config/wompi";

/**
 * NequiForm Component
 * Nequi payment form
 */
export const NequiForm = ({ nequiPhone, setNequiPhone, isProcessing }) => {
  return (
    <>
      <div className="checkout-form">
        <div className="checkout-form-field">
          <label htmlFor="nequi-phone">Número de Teléfono Nequi *</label>
          <input
            id="nequi-phone"
            type="tel"
            placeholder="3991111111"
            value={nequiPhone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 10) {
                setNequiPhone(value);
              }
            }}
            maxLength="10"
            disabled={isProcessing}
          />
          <small
            style={{
              color: "#6b7280",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            Ingresa tu número de teléfono Nequi de 10 dígitos
          </small>
        </div>
      </div>

      <div className="checkout-test-cards">
        <p className="checkout-test-cards-title">Números de Prueba Nequi (Sandbox):</p>
        <p className="checkout-test-cards-info">
          Aprobado: <strong>{WOMPI_TEST_DATA.NEQUI.approved}</strong> | Rechazado:{" "}
          <strong>{WOMPI_TEST_DATA.NEQUI.declined}</strong>
        </p>
      </div>
    </>
  );
};
