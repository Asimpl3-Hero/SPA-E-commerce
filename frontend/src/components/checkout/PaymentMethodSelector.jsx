/**
 * PaymentMethodSelector Component
 * Radio button selector for payment methods (Card or Nequi)
 */
export const PaymentMethodSelector = ({
  paymentMethod,
  setPaymentMethod,
  isProcessing,
}) => {
  return (
    <div className="payment-method-selector">
      <label>Selecciona Método de Pago *</label>
      <div className="payment-method-options">
        <button
          type="button"
          className={`payment-method-option ${
            paymentMethod === "CARD" ? "selected" : ""
          }`}
          onClick={() => setPaymentMethod("CARD")}
          disabled={isProcessing}
        >
          <div className="payment-method-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="5"
                width="20"
                height="14"
                rx="2"
                stroke="#3b82f6"
                strokeWidth="1.5"
                fill="#eff6ff"
              />
              <path d="M2 9h20" stroke="#3b82f6" strokeWidth="1.5" />
              <rect
                x="5"
                y="13"
                width="6"
                height="2"
                rx="0.5"
                fill="#3b82f6"
              />
              <rect
                x="13"
                y="13"
                width="3"
                height="2"
                rx="0.5"
                fill="#3b82f6"
              />
            </svg>
          </div>
          <span className="payment-method-name">Tarjeta Crédito/Débito</span>
        </button>
        <button
          type="button"
          className={`payment-method-option ${
            paymentMethod === "NEQUI" ? "selected" : ""
          }`}
          onClick={() => setPaymentMethod("NEQUI")}
          disabled={isProcessing}
        >
          <div className="payment-method-icon nequi-logo">
            <img
              src="https://www.svgrepo.com/show/518153/nequi-colombia.svg"
              alt="Nequi"
              width="48"
              height="48"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "none" }}
            >
              <rect width="48" height="48" rx="8" fill="#CA0080" />
              <text
                x="24"
                y="32"
                fontFamily="Arial, sans-serif"
                fontSize="20"
                fontWeight="bold"
                fill="white"
                textAnchor="middle"
              >
                N
              </text>
            </svg>
          </div>
          <span className="payment-method-name">Nequi</span>
        </button>
      </div>
    </div>
  );
};
