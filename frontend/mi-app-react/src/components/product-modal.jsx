import { X, ShoppingCart, Star, Plus, Minus, Package, Truck, Shield, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addItem, setCartOpen } from "@/store/cartSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import "@/styles/components/product-modal.css";

/**
 * ProductModal Component
 * Displays detailed product information in a modal dialog
 * @param {Object} product - The product to display
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 */
export function ProductModal({ product, isOpen, onClose }) {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch(addItem(product));
    }
    dispatch(setCartOpen(true));
    onClose();
  };

  const stock = product.stock || 0;
  const inStock = stock > 0;
  const lowStock = stock > 0 && stock <= 10;
  const maxQuantity = Math.min(stock, 99);

  const incrementQuantity = () => setQuantity((prev) => Math.min(prev + 1, maxQuantity));
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="product-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="product-modal-close"
          aria-label="Close modal"
        >
          <X className="product-modal-close-icon" />
        </button>

        <div className="product-modal-content">
          {/* Left Side: Image */}
          <div className="product-modal-image-section">
            <div className="product-modal-image-wrapper">
              {product.badge && (
                <Badge variant={product.badge.variant} className="product-modal-badge">
                  {product.badge.text}
                </Badge>
              )}
              <img
                src={product.image}
                alt={product.name}
                className="product-modal-image"
              />
            </div>
          </div>

          {/* Right Side: Details */}
          <div className="product-modal-details">
            {/* Category */}
            <p className="product-modal-category">{product.category}</p>

            {/* Product Name */}
            <h2 id="modal-title" className="product-modal-title">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="product-modal-rating">
              <div className="product-modal-rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`product-modal-rating-icon ${
                      i < Math.floor(product.rating)
                        ? "product-modal-rating-icon-filled"
                        : "product-modal-rating-icon-empty"
                    }`}
                  />
                ))}
              </div>
              <span className="product-modal-rating-value">{product.rating}</span>
              <span className="product-modal-rating-count">
                ({product.reviews} reviews)
              </span>
            </div>

            {/* Description */}
            <p className="product-modal-description">{product.description}</p>

            {/* Stock & Additional Info */}
            <div className="product-modal-info-grid">
              {/* Stock Status */}
              <div className="product-modal-info-item">
                <Package className="product-modal-info-icon" />
                <div className="product-modal-info-text">
                  <span className="product-modal-info-label">Stock</span>
                  <span className={`product-modal-stock-status ${
                    !inStock ? 'product-modal-stock-out' :
                    lowStock ? 'product-modal-stock-low' :
                    'product-modal-stock-available'
                  }`}>
                    {!inStock ? 'Out of Stock' :
                     lowStock ? `Only ${stock} left!` :
                     `${stock} available`}
                  </span>
                </div>
              </div>

              {/* Shipping */}
              <div className="product-modal-info-item">
                <Truck className="product-modal-info-icon" />
                <div className="product-modal-info-text">
                  <span className="product-modal-info-label">Shipping</span>
                  <span className="product-modal-info-value">Free delivery</span>
                </div>
              </div>

              {/* Warranty */}
              <div className="product-modal-info-item">
                <Shield className="product-modal-info-icon" />
                <div className="product-modal-info-text">
                  <span className="product-modal-info-label">Warranty</span>
                  <span className="product-modal-info-value">1 Year</span>
                </div>
              </div>

              {/* Returns */}
              <div className="product-modal-info-item">
                <RefreshCw className="product-modal-info-icon" />
                <div className="product-modal-info-text">
                  <span className="product-modal-info-label">Returns</span>
                  <span className="product-modal-info-value">30 Days</span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="product-modal-price-section">
              <div className="product-modal-prices">
                <span className="product-modal-price">{formatCurrency(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="product-modal-original-price">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <span className="product-modal-discount">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="product-modal-quantity-section">
              <label className="product-modal-quantity-label">Quantity:</label>
              <div className="product-modal-quantity-controls">
                <button
                  onClick={decrementQuantity}
                  className="product-modal-quantity-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus className="product-modal-quantity-icon" />
                </button>
                <span className="product-modal-quantity-value">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="product-modal-quantity-btn"
                  aria-label="Increase quantity"
                >
                  <Plus className="product-modal-quantity-icon" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="product-modal-add-to-cart"
              disabled={!inStock}
            >
              <ShoppingCart className="product-modal-cart-icon" />
              {!inStock ? 'Out of Stock' : `Add to Cart - ${formatCurrency(product.price * quantity)}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
