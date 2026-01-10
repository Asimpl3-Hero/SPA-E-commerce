import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDispatch } from "react-redux";
import { addItem, setCartOpen } from "@/store/cartSlice";
import "@/styles/components/product-card.css";

export function ProductCard({ product }) {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addItem(product));
    dispatch(setCartOpen(true));
  };

  return (
    <Card className="product-card group">
      <div className="product-card-image-wrapper">
        {product.badge && (
          <Badge className="product-card-badge">
            {product.badge}
          </Badge>
        )}
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="product-card-image"
        />
      </div>

      <CardContent className="product-card-content">
        <div className="product-card-rating">
          <Star className="product-card-rating-icon" />
          <span className="product-card-rating-value">{product.rating}</span>
          <span className="product-card-rating-count">
            ({product.reviews.toLocaleString()})
          </span>
        </div>

        <p className="product-card-category">
          {product.category}
        </p>

        <h3 className="product-card-title">
          {product.name}
        </h3>

        <p className="product-card-description">
          {product.description}
        </p>

        <div className="product-card-footer">
          <div className="product-card-prices">
            <span className="product-card-price">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="product-card-original-price">
                ${product.originalPrice}
              </span>
            )}
          </div>

          <Button size="sm" onClick={handleAddToCart} className="product-card-button">
            <Plus className="product-card-button-icon" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
