import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDispatch } from "react-redux";
import { addItem, setCartOpen } from "@/store/cartSlice";
import "@/styles/components/product-card.css";

export function ProductCard({ product, onOpenModal }) {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addItem(product));
    dispatch(setCartOpen(true));
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
            <span className="product-card-price">${product.price}</span>
            {product.originalPrice && (
              <span className="product-card-original-price">
                ${product.originalPrice}
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            className="product-card-button"
          >
            <Plus className="product-card-button-icon" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
