import { renderHook, act, waitFor } from "@testing-library/react";
import { useUnifiedCheckout } from "../useUnifiedCheckout";
import { WompiGateway } from "@/services/paymentGateways/WompiGateway";

// Mock the wompi config to avoid import.meta issues
jest.mock("@/config/wompi", () => ({
  WOMPI_CONFIG: {
    API_URL: "https://api-sandbox.co.uat.wompi.dev/v1",
    PUBLIC_KEY: "pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7",
    BACKEND_URL: "http://localhost:4567/api/checkout",
    SCRIPT_URL: "https://checkout.wompi.co/widget.js",
  },
  WOMPI_TEST_DATA: {
    CARD: {
      number: "4242 4242 4242 4242",
      cvc: "Any 3 digits",
      expiration: "Any future date",
    },
    NEQUI: {
      approved: "3991111111",
      declined: "3992222222",
    },
  },
}));

// Mock WompiGateway
jest.mock("@/services/paymentGateways/WompiGateway");

describe("useUnifiedCheckout", () => {
  let mockGetCartSummary;
  let mockEmptyCart;
  let mockOnSuccess;
  let mockWompiInstance;

  const defaultItems = [
    { id: 1, name: "Product 1", price: 100, quantity: 2 },
    { id: 2, name: "Product 2", price: 50, quantity: 1 },
  ];

  beforeEach(() => {
    mockGetCartSummary = jest.fn(() => ({ total: 250, subtotal: 250, tax: 0 }));
    mockEmptyCart = jest.fn();
    mockOnSuccess = jest.fn();

    mockWompiInstance = {
      getSupportedMethods: jest.fn(() => ["CARD", "NEQUI"]),
      detectCardType: jest.fn((number) => {
        if (number.startsWith("4")) return "VISA";
        if (number.startsWith("5")) return "MASTERCARD";
        return null;
      }),
      validate: jest.fn(() => ({ valid: true, errors: {} })),
      tokenize: jest.fn(() => Promise.resolve("tok_test_12345")),
      preparePaymentMethodData: jest.fn((method, cardData, nequiPhone, token) => ({
        type: method,
        token: token || null,
      })),
      processPayment: jest.fn(() =>
        Promise.resolve({
          order: { reference: "ORD-123" },
          transaction: { id: "txn-456" },
        })
      ),
      getPaymentStatus: jest.fn(() => Promise.resolve("APPROVED")),
    };

    WompiGateway.mockImplementation(() => mockWompiInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with wompi gateway by default", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      expect(result.current.state.gateway).toBe("wompi");
      expect(result.current.state.supportedMethods).toEqual(["CARD", "NEQUI"]);
    });

    it("should initialize with null gateway when gateway is not wompi", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          gateway: "mock",
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      expect(result.current.state.gateway).toBe("mock");
      expect(result.current.state.supportedMethods).toEqual([]);
    });

    it("should set default payment method to first supported method", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      expect(result.current.state.paymentMethod).toBe("CARD");
    });
  });

  describe("handleCardNumberChange", () => {
    it("should format card number with spaces", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.handleCardNumberChange("4111111111111111");
      });

      expect(result.current.state.cardData.number).toBe("4111 1111 1111 1111");
    });

    it("should detect VISA card type", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.handleCardNumberChange("4111111111111111");
      });

      expect(result.current.state.cardType).toBe("VISA");
    });

    it("should detect MASTERCARD type", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.handleCardNumberChange("5555555555554444");
      });

      expect(result.current.state.cardType).toBe("MASTERCARD");
    });

    it("should not detect card type when gateway is null", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          gateway: "mock",
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.handleCardNumberChange("4111111111111111");
      });

      expect(result.current.state.cardType).toBeNull();
    });
  });

  describe("validateForm", () => {
    it("should fail validation when customer email is missing", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      let checkoutResult;
      await act(async () => {
        checkoutResult = await result.current.actions.handleCheckout();
      });

      expect(checkoutResult).toBe(false);
      expect(result.current.state.error).toBe(
        "Please fill in all customer information"
      );
    });

    it("should fail validation when customer name is missing", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "",
          phone: "1234567890",
        });
      });

      let checkoutResult;
      await act(async () => {
        checkoutResult = await result.current.actions.handleCheckout();
      });

      expect(checkoutResult).toBe(false);
      expect(result.current.state.error).toBe(
        "Please fill in all customer information"
      );
    });

    it("should fail validation when customer phone is missing", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "",
        });
      });

      let checkoutResult;
      await act(async () => {
        checkoutResult = await result.current.actions.handleCheckout();
      });

      expect(checkoutResult).toBe(false);
      expect(result.current.state.error).toBe(
        "Please fill in all customer information"
      );
    });

    it("should fail validation when payment method validation fails", async () => {
      mockWompiInstance.validate.mockReturnValue({
        valid: false,
        errors: { card_number: "Invalid card number" },
      });

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      let checkoutResult;
      await act(async () => {
        checkoutResult = await result.current.actions.handleCheckout();
      });

      expect(checkoutResult).toBe(false);
      expect(result.current.state.error).toBe("Invalid card number");
    });

    it("should pass validation with valid data", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      expect(mockWompiInstance.processPayment).toHaveBeenCalled();
    });
  });

  describe("handleTransactionStatus", () => {
    it("should handle APPROVED status", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      await waitFor(() => {
        expect(mockEmptyCart).toHaveBeenCalled();
        expect(result.current.state.alert.type).toBe("success");
        expect(result.current.state.alert.title).toBe("¡Pago Exitoso!");
      });
    });

    it("should handle DECLINED status", async () => {
      mockWompiInstance.getPaymentStatus.mockResolvedValue("DECLINED");

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      await waitFor(() => {
        expect(result.current.state.alert.type).toBe("error");
        expect(result.current.state.alert.title).toBe("Pago Rechazado");
      });
    });

    it("should handle ERROR status", async () => {
      mockWompiInstance.getPaymentStatus.mockResolvedValue("ERROR");

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      await waitFor(() => {
        expect(result.current.state.alert.type).toBe("error");
        expect(result.current.state.alert.title).toBe("Error en el Pago");
      });
    });

    it("should handle PENDING status", async () => {
      mockWompiInstance.getPaymentStatus.mockResolvedValue("PENDING");

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      await waitFor(() => {
        expect(result.current.state.alert.type).toBe("warning");
        expect(result.current.state.alert.title).toBe("Pago en Proceso");
      });
    });

    it("should handle unknown status", async () => {
      mockWompiInstance.getPaymentStatus.mockResolvedValue("UNKNOWN");

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      // Unknown status should not trigger any specific alert
      await waitFor(() => {
        expect(result.current.state.isProcessing).toBe(false);
      });
    });
  });

  describe("handleCheckout", () => {
    it("should fail when no payment gateway is configured", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          gateway: "mock",
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      let checkoutResult;
      await act(async () => {
        checkoutResult = await result.current.actions.handleCheckout();
      });

      expect(checkoutResult).toBe(false);
      expect(result.current.state.error).toBe("No payment gateway configured");
    });

    it("should tokenize card for CARD payment method", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
        result.current.actions.setPaymentMethod("CARD");
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      expect(mockWompiInstance.tokenize).toHaveBeenCalled();
    });

    it("should not tokenize card for NEQUI payment method", async () => {
      mockWompiInstance.getSupportedMethods.mockReturnValue(["NEQUI", "CARD"]);

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
        result.current.actions.setPaymentMethod("NEQUI");
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      expect(mockWompiInstance.tokenize).not.toHaveBeenCalled();
    });

    it("should handle successful checkout with transaction", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      expect(mockWompiInstance.processPayment).toHaveBeenCalled();
      expect(mockWompiInstance.getPaymentStatus).toHaveBeenCalledWith("txn-456");
    });

    it("should handle checkout without transaction", async () => {
      mockWompiInstance.processPayment.mockResolvedValue({
        order: { reference: "ORD-123" },
        transaction: null,
      });

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      await waitFor(() => {
        expect(mockEmptyCart).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith("ORD-123", expect.any(Object));
      });
    });

    it("should handle polling error", async () => {
      mockWompiInstance.getPaymentStatus.mockRejectedValue(
        new Error("Polling failed")
      );

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      await waitFor(() => {
        expect(result.current.state.alert.type).toBe("error");
        expect(result.current.state.alert.title).toBe("Error en el Proceso");
      });
    });

    it("should handle general checkout error", async () => {
      mockWompiInstance.processPayment.mockRejectedValue(
        new Error("Payment failed")
      );

      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      await waitFor(() => {
        expect(result.current.state.alert.type).toBe("error");
        expect(result.current.state.isProcessing).toBe(false);
      });
    });

    it("should clear error before processing", async () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setError("Previous error");
        result.current.actions.setCustomerData({
          email: "test@example.com",
          name: "John Doe",
          phone: "1234567890",
        });
      });

      await act(async () => {
        await result.current.actions.handleCheckout();
      });

      expect(result.current.state.error).toBeNull();
    });
  });

  describe("state setters", () => {
    it("should update card data", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setCardData({
          number: "4111111111111111",
          cvc: "123",
          exp_month: "12",
          exp_year: "2025",
          card_holder: "John Doe",
        });
      });

      expect(result.current.state.cardData.number).toBe("4111111111111111");
      expect(result.current.state.cardData.cvc).toBe("123");
    });

    it("should update nequi phone", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setNequiPhone("3001234567");
      });

      expect(result.current.state.nequiPhone).toBe("3001234567");
    });

    it("should update payment method", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setPaymentMethod("NEQUI");
      });

      expect(result.current.state.paymentMethod).toBe("NEQUI");
    });

    it("should update alert", () => {
      const { result } = renderHook(() =>
        useUnifiedCheckout({
          items: defaultItems,
          getCartSummary: mockGetCartSummary,
          emptyCart: mockEmptyCart,
          onSuccess: mockOnSuccess,
        })
      );

      act(() => {
        result.current.actions.setAlert({
          isOpen: true,
          type: "success",
          title: "Test",
          message: "Test message",
        });
      });

      expect(result.current.state.alert.isOpen).toBe(true);
      expect(result.current.state.alert.type).toBe("success");
    });
  });
});
