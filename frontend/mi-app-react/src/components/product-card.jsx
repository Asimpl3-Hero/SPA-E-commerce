import { Star, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { addItem } from "@/store/cartSlice";
import { formatCurrency } from "@/utils/formatters";
import "@/styles/components/product-card.css";

export function ProductCard({ product, onOpenModal }) {
  const dispatch = useDispatch();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addItem(product));

    // Show feedback
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleCardClick = () => {
    if (onOpenModal) {
      onOpenModal(product);
    }
  };

  return (
    <Card className="product-card" onClick={handleCardClick}>
      {/* Product Image */}
      <div className="product-card-image-wrapper">
        {product.badge && (
          <Badge variant={product.badge.variant} className="product-card-badge">
            {product.badge.text}
          </Badge>
        )}
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="product-card-image"
        />
      </div>

      {/* Product Details */}
      <CardContent className="product-card-content">
        {/* Rating */}
        <div className="product-card-rating">
          <Star className="product-card-rating-icon" />
          <span className="product-card-rating-value">{product.rating}</span>
          <span className="product-card-rating-count">
            ({product.reviews.toLocaleString()})
          </span>
        </div>

        {/* Category */}
        <p className="product-card-category">{product.category}</p>

        {/* Title */}
        <h3 className="product-card-title">{product.name}</h3>

        {/* Description */}
        <p className="product-card-description">{product.description}</p>

        {/* Footer: Price & Add to Cart */}
        <div className="product-card-footer">
          <div className="product-card-prices">
            <span className="product-card-price">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="product-card-original-price">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            className={`product-card-button ${isAdded ? 'product-card-button-added' : ''}`}
          >
            {isAdded ? (
              <>
                <Check className="product-card-button-icon" />
                Añadido
              </>
            ) : (
              <>
                <ShoppingBag className="product-card-button-icon" />
                Añadir
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
