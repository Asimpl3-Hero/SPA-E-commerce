import { ProductCard } from "@/components/product-card";
import { useMemo } from "react";
import "@/styles/components/product-grid.css";

const PRODUCTS = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    price: 299,
    originalPrice: 399,
    rating: 4.8,
    reviews: 2847,
    category: "Audio",
    badge: "Best Seller",
    image: "/placeholder.svg",
    description: "Premium over-ear headphones with industry-leading noise cancellation",
  },
  {
    id: 2,
    name: "Smartwatch Pro Series 8",
    price: 449,
    rating: 4.9,
    reviews: 1923,
    category: "Wearables",
    badge: "New",
    image: "/placeholder.svg",
    description: "Advanced health tracking and fitness features with always-on display",
  },
  {
    id: 3,
    name: "Wireless Gaming Mouse",
    price: 89,
    originalPrice: 129,
    rating: 4.7,
    reviews: 3214,
    category: "Gaming",
    image: "/placeholder.svg",
    description: "Ultra-responsive wireless gaming mouse with RGB lighting",
  },
  {
    id: 4,
    name: "4K Webcam Ultra HD",
    price: 199,
    rating: 4.6,
    reviews: 892,
    category: "Cameras",
    image: "/placeholder.svg",
    description: "Crystal-clear 4K video calls with auto-framing technology",
  },
  {
    id: 5,
    name: "Portable SSD 2TB",
    price: 179,
    originalPrice: 249,
    rating: 4.9,
    reviews: 1456,
    category: "Storage",
    image: "/placeholder.svg",
    description: "Lightning-fast portable storage with USB-C connectivity",
  },
  {
    id: 6,
    name: "Mechanical Keyboard RGB",
    price: 159,
    rating: 4.8,
    reviews: 2103,
    category: "Peripherals",
    badge: "Popular",
    image: "/placeholder.svg",
    description: "Premium mechanical switches with customizable RGB backlighting",
  },
];

export function ProductGrid({ searchQuery }) {
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return PRODUCTS;

    const query = searchQuery.toLowerCase();
    return PRODUCTS.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <section id="products" className="product-grid-section">
      <div className="product-grid-container">
        <div className="product-grid-header">
          <h2 className="product-grid-title">
            {searchQuery ? "Search Results" : "Featured Products"}
          </h2>
          <p className="product-grid-subtitle">
            {searchQuery
              ? `Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""}`
              : "Discover our latest collection of premium electronics"}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="product-grid-empty">
            <p className="product-grid-empty-text">
              No products found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
