import { useState } from "react";
import { WompiGateway } from "@/services/paymentGateways/WompiGateway";

/**
 * Unified Checkout Hook
 * Supports multiple payment gateways with a consistent interface
 *
 * @param {Object} options - Configuration options
 * @param {string} options.gateway - Payment gateway: 'wompi' (default), 'mock'
 * @param {Array} options.items - Cart items
 * @param {Function} options.getCartSummary - Function to get cart summary
 * @param {Function} options.emptyCart - Function to empty the cart
 * @param {Function} options.onSuccess - Success callback
 * @returns {Object} Checkout state and actions
 */
export const useUnifiedCheckout = ({
  gateway = "wompi",
  items,
  getCartSummary,
  emptyCart,
  onSuccess,
}) => {
  // Initialize payment gateway
  const [paymentGateway] = useState(() => {
    if (gateway === "wompi") {
      return new WompiGateway();
    }
    return null; // Mock/no gateway
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [error, setError] = useState(null);

  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState(() => {
    const supportedMethods = paymentGateway?.getSupportedMethods() || ["CARD"];
    return supportedMethods[0];
  });

  // Card form state
  const [cardData, setCardData] = useState({
    number: "",
    cvc: "",
    exp_month: "",
    exp_year: "",
    card_holder: "",
  });

  // Card type detection
  const [cardType, setCardType] = useState(null);

  // Nequi form state
  const [nequiPhone, setNequiPhone] = useState("");

  // Customer form state
  const [customerData, setCustomerData] = useState({
    email: "",
    name: "",
    phone: "",
  });

  // Delivery form state
  const [deliveryData, setDeliveryData] = useState({
    address_line_1: "",
    address_line_2: "",
    city: "",
    region: "",
    country: "CO",
    postal_code: "",
    delivery_notes: "",
  });

  /**
   * Update card number and detect card type
   */
  const handleCardNumberChange = (value) => {
    const cleanValue = value.replace(/\s/g, "");
    const formatted = cleanValue.match(/.{1,4}/g)?.join(" ") || cleanValue;
    setCardData({ ...cardData, number: formatted });

    if (paymentGateway?.detectCardType) {
      const detected = paymentGateway.detectCardType(cleanValue);
      setCardType(detected);
    }
  };

  /**
   * Validate customer and payment data
   */
  const validateForm = () => {
    // Validate customer data
    if (!customerData.email || !customerData.name || !customerData.phone) {
      setError("Por favor completa toda la información del cliente");
      return false;
    }

    // Validate delivery data
    if (!deliveryData.address_line_1 || !deliveryData.city || !deliveryData.region) {
      setError("Por favor completa la dirección de entrega (dirección, ciudad y departamento)");
      return false;
    }

    // Validate payment method data using gateway validator
    if (paymentGateway) {
      const validation = paymentGateway.validate({
        method: paymentMethod,
        cardData,
        nequiPhone,
      });

      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0];
        setError(firstError);
        return false;
      }
    }

    return true;
  };

  /**
   * Handle transaction status and show appropriate alert
   */
  const handleTransactionStatus = (status, orderReference) => {
    switch (status) {
      case "APPROVED":
        emptyCart();
        setAlert({
          isOpen: true,
          type: "success",
          title: "¡Pago Exitoso!",
          message: `Tu orden ${orderReference} ha sido procesada correctamente. Recibirás un correo de confirmación pronto.`,
        });
        return true;

      case "DECLINED":
        setAlert({
          isOpen: true,
          type: "error",
          title: "Pago Rechazado",
          message:
            "Tu pago fue rechazado. Por favor, intenta con otro método de pago o tarjeta.",
        });
        return false;

      case "ERROR":
        setAlert({
          isOpen: true,
          type: "error",
          title: "Error en el Pago",
          message:
            "Ocurrió un error al procesar tu pago. Por favor, intenta nuevamente.",
        });
        return false;

      case "PENDING":
        setAlert({
          isOpen: true,
          type: "warning",
          title: "Pago en Proceso",
          message:
            "Tu pago está tomando más tiempo del esperado. Verifica el estado de tu orden más tarde.",
        });
        return false;

      default:
        return false;
    }
  };

  /**
   * Main checkout handler
   */
  const handleCheckout = async () => {
    setError(null);

    if (!validateForm()) {
      return false;
    }

    if (!paymentGateway) {
      setError("No payment gateway configured");
      return false;
    }

    setIsProcessing(true);
    setProcessingMessage("Processing payment...");

    try {
      let paymentMethodData;
      let cardToken = null;

      // Tokenize card if needed
      if (paymentMethod === "CARD") {
        setProcessingMessage("Tokenizing card...");
        cardToken = await paymentGateway.tokenize(cardData);
      }

      // Prepare payment method data
      paymentMethodData = paymentGateway.preparePaymentMethodData(
        paymentMethod,
        cardData,
        nequiPhone,
        cardToken
      );

      const summary = getCartSummary();

      // Create order
      setProcessingMessage("Creating order...");
      const orderData = {
        customer_email: customerData.email,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        amount_in_cents: Math.round(summary.total * 100),
        currency: "COP",
        payment_method: paymentMethodData,
        items: items.map((item) => ({
          product_id: item.id,
          name: item.name,
          price_at_purchase: Math.round(item.price * 100),
          quantity: item.quantity,
        })),
        shipping_address: {
          address_line_1: deliveryData.address_line_1,
          address_line_2: deliveryData.address_line_2 || undefined,
          city: deliveryData.city,
          region: deliveryData.region,
          country: deliveryData.country || "CO",
          postal_code: deliveryData.postal_code || undefined,
          phone_number: customerData.phone,
          delivery_notes: deliveryData.delivery_notes || undefined,
        },
      };

      const response = await paymentGateway.processPayment(orderData);

      // Poll transaction status if transaction was created
      if (response.transaction && response.transaction.id) {
        const transactionId = response.transaction.id;

        try {
          setProcessingMessage("Verifying payment status...");
          const transactionStatus = await paymentGateway.getPaymentStatus(transactionId);
          const isApproved = handleTransactionStatus(
            transactionStatus,
            response.order.reference
          );

          if (isApproved) {
            // Close modal after showing success alert
            setTimeout(() => {
              if (onSuccess) {
                onSuccess(response.order.reference, {
                  items,
                  customerData,
                  paymentMethod,
                  cardData,
                  summary,
                });
              }
            }, 3000);
            return true;
          }
        } catch (pollingError) {
          console.error("Polling error:", pollingError);
          throw new Error(
            pollingError.message || "Failed to verify payment status"
          );
        }
      } else {
        // No transaction ID, order created without payment
        emptyCart();
        if (onSuccess) {
          onSuccess(response.order.reference, {
            items,
            customerData,
            paymentMethod,
            cardData,
            summary,
          });
        }
        return true;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setAlert({
        isOpen: true,
        type: "error",
        title: "Error en el Proceso",
        message:
          error.message ||
          "No se pudo procesar el pago. Por favor, intenta nuevamente.",
      });
      return false;
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  return {
    state: {
      isProcessing,
      processingMessage,
      error,
      alert,
      paymentMethod,
      cardData,
      cardType,
      nequiPhone,
      customerData,
      deliveryData,
      supportedMethods: paymentGateway?.getSupportedMethods() || [],
      gateway: gateway,
    },
    actions: {
      setError,
      setAlert,
      setPaymentMethod,
      setCardData,
      handleCardNumberChange,
      setNequiPhone,
      setCustomerData,
      setDeliveryData,
      handleCheckout,
    },
  };
};
