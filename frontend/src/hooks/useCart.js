import { useDispatch, useSelector } from "react-redux";
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  toggleCart,
  setCartOpen,
  selectCartItems,
  selectIsCartOpen,
  selectTotalItems,
  selectCartTotal,
} from "@/store/cartSlice";

/**
 * Custom hook for cart operations
 * Provides a clean API for interacting with the cart state
 * @returns {Object} Cart state and operations
 */
export const useCart = () => {
  const dispatch = useDispatch();

  const items = useSelector(selectCartItems);
  const isOpen = useSelector(selectIsCartOpen);
  const totalItems = useSelector(selectTotalItems);
  const totalPrice = useSelector(selectCartTotal);

  const addToCart = (product) => {
    dispatch(addItem(product));
  };

  const removeFromCart = (productId) => {
    dispatch(removeItem(productId));
  };

  const updateItemQuantity = (productId, quantity) => {
    dispatch(updateQuantity({ id: productId, quantity }));
  };

  const incrementQuantity = (productId) => {
    const item = items.find((item) => item.id === productId);
    if (item) {
      dispatch(updateQuantity({ id: productId, quantity: item.quantity + 1 }));
    }
  };

  const decrementQuantity = (productId) => {
    const item = items.find((item) => item.id === productId);
    if (item && item.quantity > 1) {
      dispatch(updateQuantity({ id: productId, quantity: item.quantity - 1 }));
    } else if (item && item.quantity === 1) {
      dispatch(removeItem(productId));
    }
  };

  const emptyCart = () => {
    dispatch(clearCart());
  };

  const openCart = () => {
    dispatch(setCartOpen(true));
  };

  const closeCart = () => {
    dispatch(setCartOpen(false));
  };

  const toggle = () => {
    dispatch(toggleCart());
  };

  const getItemQuantity = (productId) => {
    const item = items.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId) => {
    return items.some((item) => item.id === productId);
  };

  const iva = Math.round(totalPrice * 0.19);

  const getCartSummary = () => {
    const subtotal = totalPrice;
    const shipping = subtotal >= 50000 ? 0 : 10000;
    const total = subtotal + iva + shipping;

    return {
      subtotal,
      shipping,
      iva,
      total,
      itemCount: totalItems,
      freeShipping: subtotal >= 50000,
      amountUntilFreeShipping: Math.max(0, 50000 - subtotal),
    };
  };

  return {
    items,
    isOpen,
    totalItems,
    totalPrice,
    iva,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    incrementQuantity,
    decrementQuantity,
    emptyCart,
    openCart,
    closeCart,
    toggle,
    getItemQuantity,
    isInCart,
    getCartSummary,
  };
};
