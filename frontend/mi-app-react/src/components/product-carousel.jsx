import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useDispatch } from "react-redux";
import { addItem } from "@/store/cartSlice";
import { formatCurrency } from "@/utils/formatters";
import "@/styles/components/product-carousel.css";

const CAROUSEL_CONFIG = {
  scrollSpeed: 1, // pixels per frame
};

export function ProductCarousel({ products, onProductClick }) {
  const [isPaused, setIsPaused] = useState(false);
  const [addedProducts, setAddedProducts] = useState(new Set());
  const dispatch = useDispatch();
  const carouselRef = useRef(null);
  const animationRef = useRef(null);

  // Get top 5 products by rating
  const topProducts = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // Duplicate products for infinite scroll effect
  const duplicatedProducts = [...topProducts, ...topProducts];

  // Auto-scroll functionality
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || topProducts.length === 0) return;

    const scrollSpeed = CAROUSEL_CONFIG.scrollSpeed;
    const halfScroll = carousel.scrollWidth / 2;

    const animate = () => {
      if (!isPaused && carousel) {
        carousel.scrollLeft += scrollSpeed;

        // Reset to beginning when reaching halfway (seamless loop)
        if (carousel.scrollLeft >= halfScroll) {
          carousel.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, topProducts]);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    dispatch(addItem(product));

    // Show feedback
    setAddedProducts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
  };

  const isAdded = (productId) => addedProducts.has(productId);

  if (topProducts.length === 0) return null;

  return (
    <section className="carousel-section">
      <div className="carousel-container">
        <div className="carousel-header">
          <h2 className="carousel-title">Los Más Populares</h2>
        </div>

        <div
          className="carousel-wrapper"
          ref={carouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Carousel Track */}
          <div className="carousel-track">
            {duplicatedProducts.map((product, idx) => (
              <div
                key={`${product.id}-${idx}`}
                className="carousel-card"
                onClick={() => onProductClick && onProductClick(product)}
              >
                {/* Image */}
                <div className="carousel-card-image-wrapper">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="carousel-card-image"
                  />
                </div>

                {/* Content */}
                <div className="carousel-card-content">
                  <h3 className="carousel-card-title">{product.name}</h3>

                  {product.description && (
                    <p className="carousel-card-description">
                      "{product.description.slice(0, 60)}..."
                    </p>
                  )}

                  <div className="carousel-card-footer">
                    <span className="carousel-card-price">
                      {formatCurrency(product.price)}
                    </span>
                    <button
                      className={`carousel-card-button ${
                        isAdded(product.id) ? "carousel-card-button-added" : ""
                      }`}
                      onClick={(e) => handleAddToCart(e, product)}
                      aria-label="Add to cart"
                    >
                      {isAdded(product.id) ? (
                        <>
                          <Check className="carousel-card-button-icon" />
                          Añadido
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="carousel-card-button-icon" />
                          Añadir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
