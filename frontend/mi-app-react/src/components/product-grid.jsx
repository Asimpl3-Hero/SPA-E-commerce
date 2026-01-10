import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { useMemo, useState } from "react";
import "@/styles/components/product-grid.css";

// Sample product data
const PRODUCTS = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    price: 299,
    originalPrice: 399,
    rating: 4.8,
    reviews: 2847,
    category: "Audio",
    badge: { text: "Best Seller", variant: "default" },
    image: "/placeholder.svg",
    description:
      "Premium over-ear headphones with industry-leading noise cancellation technology. Experience immersive audio with up to 30 hours of battery life and supreme comfort for all-day wear.",
  },
  {
    id: 2,
    name: "Smartwatch Pro Series 8",
    price: 449,
    rating: 4.9,
    reviews: 1923,
    category: "Wearables",
    badge: { text: "New", variant: "new" },
    image: "/placeholder.svg",
    description:
      "Advanced health tracking and fitness features with always-on display. Monitor your heart rate, blood oxygen, sleep quality, and stay connected with smart notifications.",
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
    description:
      "Ultra-responsive wireless gaming mouse with customizable RGB lighting. Features precision tracking up to 25,600 DPI, programmable buttons, and ultra-fast wireless connectivity for competitive gaming.",
  },
  {
    id: 4,
    name: "4K Webcam Ultra HD",
    price: 199,
    rating: 4.6,
    reviews: 892,
    category: "Cameras",
    image: "/placeholder.svg",
    description:
      "Crystal-clear 4K video calls with auto-framing technology and enhanced low-light performance. Perfect for streaming, video conferencing, and content creation with professional-grade image quality.",
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
    description:
      "Lightning-fast portable storage with USB-C connectivity. Transfer speeds up to 1050MB/s, durable aluminum housing, and password protection to keep your data secure on the go.",
  },
  {
    id: 6,
    name: "Mechanical Keyboard RGB",
    price: 159,
    rating: 4.8,
    reviews: 2103,
    category: "Peripherals",
    badge: { text: "Popular", variant: "info" },
    image: "/placeholder.svg",
    description:
      "Premium mechanical switches with customizable RGB backlighting and per-key illumination. Tactile feedback, N-key rollover, and dedicated media controls for the ultimate typing experience.",
  },
];

export function ProductGrid({ searchQuery }) {
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter products based on search query
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

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <section id="products" className="product-grid-section">
        <div className="product-grid-container">
          {/* Header Section */}
          <div className="product-grid-header">
            <h2 className="product-grid-title">
              {searchQuery ? "Search Results" : "Featured Products"}
            </h2>
            <p className="product-grid-subtitle">
              {searchQuery
                ? `Found ${filteredProducts.length} product${
                    filteredProducts.length !== 1 ? "s" : ""
                  }`
                : "Discover our latest collection of premium electronics"}
            </p>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="product-grid-empty">
              <p className="product-grid-empty-text">
                No products found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            /* Product Grid */
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={handleOpenModal}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
