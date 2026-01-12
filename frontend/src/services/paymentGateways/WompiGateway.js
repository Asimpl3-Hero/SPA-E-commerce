import { BasePaymentGateway } from "./BasePaymentGateway";
import { WOMPI_CONFIG } from "@/config/wompi";
import { createOrder } from "@/services/checkoutService";

/**
 * Wompi Payment Gateway Adapter
 * Handles Wompi-specific payment processing
 */
export class WompiGateway extends BasePaymentGateway {
  constructor() {
    super(WOMPI_CONFIG);
  }

  /**
   * Get supported payment methods
   */
  getSupportedMethods() {
    return ["CARD", "NEQUI"];
  }

  /**
   * Detect card type based on card number
   */
  detectCardType(number) {
    const cleanNumber = number.replace(/\s/g, "");

    if (/^4/.test(cleanNumber)) {
      return { type: "visa", name: "Visa" };
    } else if (
      /^5[1-5]/.test(cleanNumber) ||
      /^2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)/.test(cleanNumber)
    ) {
      return { type: "mastercard", name: "Mastercard" };
    } else if (/^3[47]/.test(cleanNumber)) {
      return { type: "amex", name: "American Express" };
    } else if (/^6(?:011|5)/.test(cleanNumber)) {
      return { type: "discover", name: "Discover" };
    } else if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) {
      return { type: "diners", name: "Diners Club" };
    }

    return null;
  }

  /**
   * Tokenize card using Wompi API
   */
  async tokenize(cardData) {
    try {
      const formattedMonth = cardData.exp_month.padStart(2, "0");

      const response = await fetch(`${this.config.API_URL}/tokens/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.PUBLIC_KEY}`,
        },
        body: JSON.stringify({
          number: cardData.number.replace(/\s/g, ""),
          cvc: cardData.cvc,
          exp_month: formattedMonth,
          exp_year: cardData.exp_year,
          card_holder: cardData.card_holder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Tokenization error:", data);
        throw new Error(
          data.error?.reason ||
            data.error?.messages?.join(", ") ||
            "Failed to tokenize card"
        );
      }

      return data.data.id;
    } catch (error) {
      console.error("Tokenization request failed:", error);
      throw error;
    }
  }

  /**
   * Validate payment method data
   */
  validate(paymentData) {
    const errors = {};
    const { method, cardData, nequiPhone } = paymentData;

    if (method === "CARD") {
      if (!cardData.number || !cardData.cvc || !cardData.exp_month ||
          !cardData.exp_year || !cardData.card_holder) {
        errors.card = "Please fill in all card information";
      } else {
        const cardNumber = cardData.number.replace(/\s/g, "");
        if (cardNumber.length < 13 || cardNumber.length > 19) {
          errors.cardNumber = "Invalid card number";
        }

        if (cardData.cvc.length < 3 || cardData.cvc.length > 4) {
          errors.cvc = "Invalid CVC";
        }

        const month = parseInt(cardData.exp_month);
        if (month < 1 || month > 12) {
          errors.expMonth = "Invalid expiration month";
        }
      }
    } else if (method === "NEQUI") {
      if (!nequiPhone) {
        errors.nequi = "Please enter your Nequi phone number";
      } else {
        const cleanPhone = nequiPhone.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
          errors.nequiPhone = "Nequi phone number must be 10 digits";
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Process payment through backend
   */
  async processPayment(orderData) {
    const response = await createOrder(orderData);

    if (!response.success) {
      throw new Error(response.error || "Failed to create order");
    }

    return response;
  }

  /**
   * Get payment status from backend
   */
  async getPaymentStatus(transactionId) {
    try {
      const statusResponse = await fetch(
        `${this.config.BACKEND_URL}/transaction-status/${transactionId}`
      );
      const statusData = await statusResponse.json();

      if (!statusData.success) {
        throw new Error("Failed to verify payment status");
      }

      return statusData.transaction.status;
    } catch (error) {
      console.error("Status check error:", error);
      throw error;
    }
  }

  /**
   * Prepare payment method data for order
   */
  preparePaymentMethodData(paymentMethod, cardData, nequiPhone, cardToken = null) {
    if (paymentMethod === "CARD") {
      return {
        type: "CARD",
        token: cardToken,
      };
    } else if (paymentMethod === "NEQUI") {
      return {
        type: "NEQUI",
        phone_number: nequiPhone.replace(/\D/g, ""),
      };
    }
    throw new Error("Unsupported payment method");
  }
}
