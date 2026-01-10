import { useState } from 'react';
import { useCart } from './useCart';
import { STORAGE_KEYS } from '@/constants/config';
import {
  isValidEmail,
  isValidPhone,
  isValidZipCode,
  isNotEmpty,
} from '@/utils/validators';

/**
 * Custom hook for checkout process
 * Manages checkout form state, validation, and order creation
 * @returns {Object} Checkout state and methods
 */
export const useCheckout = () => {
  const { items, totalPrice, getCartSummary, emptyCart } = useCart();

  // Form state
  const [formData, setFormData] = useState(() => {
    // Load saved checkout data if exists
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKOUT_DATA);
    return saved
      ? JSON.parse(saved)
      : {
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States',
          shippingMethod: 'standard',
          paymentMethod: 'credit_card',
        };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  /**
   * Updates a form field value
   */
  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_DATA, JSON.stringify(updated));
      return updated;
    });

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validates all form fields
   */
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!isNotEmpty(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // First name validation
    if (!isNotEmpty(formData.firstName)) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!isNotEmpty(formData.lastName)) {
      newErrors.lastName = 'Last name is required';
    }

    // Phone validation
    if (!isNotEmpty(formData.phone)) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Address validation
    if (!isNotEmpty(formData.address)) {
      newErrors.address = 'Address is required';
    }

    // City validation
    if (!isNotEmpty(formData.city)) {
      newErrors.city = 'City is required';
    }

    // State validation
    if (!isNotEmpty(formData.state)) {
      newErrors.state = 'State is required';
    }

    // Zip code validation
    if (!isNotEmpty(formData.zipCode)) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!isValidZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid zip code';
    }

    // Country validation
    if (!isNotEmpty(formData.country)) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submits the checkout form
   */
  const submitCheckout = async () => {
    // Validate form
    if (!validateForm()) {
      return { success: false, error: 'Please fix the errors in the form' };
    }

    // Check if cart has items
    if (items.length === 0) {
      return { success: false, error: 'Your cart is empty' };
    }

    setIsSubmitting(true);

    try {
      const summary = getCartSummary();

      // Prepare order data
      const orderData = {
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        shipping: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          method: formData.shippingMethod,
        },
        payment: {
          method: formData.paymentMethod,
        },
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        summary: {
          subtotal: summary.subtotal,
          shipping: summary.shipping,
          tax: summary.tax,
          total: summary.total,
        },
      };

      // TODO: Replace with actual API call
      // const response = await fetch(buildApiUrl(API_ENDPOINTS.ORDERS.CREATE), {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(orderData),
      // });

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate success response
      const mockOrderId = `ORD-${Date.now()}`;

      // Save order ID
      setOrderId(mockOrderId);
      localStorage.setItem(STORAGE_KEYS.ORDER_ID, mockOrderId);

      // Clear cart after successful order
      emptyCart();

      // Clear checkout data
      localStorage.removeItem(STORAGE_KEYS.CHECKOUT_DATA);

      setOrderSuccess(true);
      setIsSubmitting(false);

      return {
        success: true,
        orderId: mockOrderId,
        orderData,
      };
    } catch (error) {
      setIsSubmitting(false);
      console.error('Checkout error:', error);
      return {
        success: false,
        error: 'Failed to process order. Please try again.',
      };
    }
  };

  /**
   * Resets the checkout form
   */
  const resetCheckout = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      shippingMethod: 'standard',
      paymentMethod: 'credit_card',
    });
    setErrors({});
    setIsSubmitting(false);
    setOrderSuccess(false);
    setOrderId(null);
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_DATA);
  };

  /**
   * Gets the order summary for review
   */
  const getOrderSummary = () => {
    return {
      items,
      ...getCartSummary(),
      customer: {
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
      },
      shipping: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        method: formData.shippingMethod,
      },
    };
  };

  return {
    formData,
    errors,
    isSubmitting,
    orderSuccess,
    orderId,
    updateField,
    validateForm,
    submitCheckout,
    resetCheckout,
    getOrderSummary,
    hasItems: items.length > 0,
    itemCount: items.length,
    total: totalPrice,
  };
};
