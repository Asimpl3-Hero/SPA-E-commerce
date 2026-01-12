import { WOMPI_TEST_DATA } from "@/config/wompi";

/**
 * CardForm Component
 * Credit/Debit card payment form
 */
export const CardForm = ({
  cardData,
  setCardData,
  cardType,
  onCardNumberChange,
  isProcessing,
}) => {
  return (
    <>
      <div className="checkout-form">
        <div className="checkout-form-field">
          <label htmlFor="card-number">
            Número de Tarjeta *{" "}
            {cardType && <span className="card-type-badge">{cardType.name}</span>}
          </label>
          <input
            id="card-number"
            type="text"
            placeholder="4242 4242 4242 4242"
            value={cardData.number}
            onChange={(e) => onCardNumberChange(e.target.value)}
            maxLength="19"
            disabled={isProcessing}
          />
        </div>
        <div className="checkout-form-field">
          <label htmlFor="card-holder">Titular de la Tarjeta *</label>
          <input
            id="card-holder"
            type="text"
            placeholder="JUAN PEREZ"
            value={cardData.card_holder}
            onChange={(e) =>
              setCardData({
                ...cardData,
                card_holder: e.target.value.toUpperCase(),
              })
            }
            disabled={isProcessing}
          />
        </div>
        <div className="checkout-form-row">
          <div className="checkout-form-field">
            <label htmlFor="exp-month">Mes de Exp. *</label>
            <input
              id="exp-month"
              type="text"
              placeholder="MM"
              value={cardData.exp_month}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 2) {
                  if (value === "" || parseInt(value) <= 12) {
                    setCardData({ ...cardData, exp_month: value });
                  }
                }
              }}
              maxLength="2"
              disabled={isProcessing}
            />
          </div>
          <div className="checkout-form-field">
            <label htmlFor="exp-year">Año de Exp. *</label>
            <input
              id="exp-year"
              type="text"
              placeholder="AA"
              value={cardData.exp_year}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setCardData({ ...cardData, exp_year: value });
              }}
              maxLength="2"
              disabled={isProcessing}
            />
          </div>
          <div className="checkout-form-field">
            <label htmlFor="cvc">CVC *</label>
            <input
              id="cvc"
              type="text"
              placeholder="123"
              value={cardData.cvc}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setCardData({ ...cardData, cvc: value });
              }}
              maxLength="4"
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>

      <div className="checkout-test-cards">
        <p className="checkout-test-cards-title">Tarjetas de Prueba (Sandbox):</p>
        <p className="checkout-test-cards-info">
          Tarjeta: <strong>{WOMPI_TEST_DATA.CARD.number}</strong> | CVC:{" "}
          {WOMPI_TEST_DATA.CARD.cvc} | Exp: {WOMPI_TEST_DATA.CARD.expiration}
        </p>
      </div>
    </>
  );
};
