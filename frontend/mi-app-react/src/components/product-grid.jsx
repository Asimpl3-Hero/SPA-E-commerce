import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { useState, useEffect } from "react";
import "@/styles/components/product-grid.css";
import { getAllProducts, searchProducts } from "@/services/productService";
import { LoadingSpinner } from "@/components/ux/loading-spinner";
import { EmptyState } from "@/components/ux/empty-state";
import { Button } from "@/components/ui/button";

export function ProductGrid({ searchQuery }) {
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(6);
  const PRODUCTS_PER_LOAD = 3;

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        let data;
        if (searchQuery && searchQuery.trim() !== '') {
          // Use search endpoint if there's a search query
          data = await searchProducts(searchQuery);
        } else {
          // Get all products otherwise
          data = await getAllProducts();
        }

        // Transform backend data to match frontend format
        const transformedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice || null,
          rating: product.rating || 0,
          reviews: product.reviews || 0,
          category: product.category,
          badge: product.badge || null,
          image: product.image || "/placeholder.svg",
          description: product.description || "",
          stock: product.stock || 0,
        }));

        setProducts(transformedProducts);
        setVisibleCount(6); // Reset visible count when products change
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PRODUCTS_PER_LOAD);
  };

  // Get visible products
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

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
                ? `Found ${products.length} product${
                    products.length !== 1 ? "s" : ""
                  }`
                : "Discover our latest collection of premium electronics"}
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            /* Error State */
            <EmptyState
              title="Error loading products"
              description={error}
            />
          ) : products.length === 0 ? (
            /* Empty State */
            <EmptyState
              title="No products found"
              description={
                searchQuery
                  ? `No products found matching "${searchQuery}"`
                  : "No products available at the moment"
              }
            />
          ) : (
            <>
              {/* Product Grid */}
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenModal={handleOpenModal}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="product-grid-load-more">
                  <p className="product-grid-load-more-count">
                    Showing {visibleProducts.length} of {products.length} products
                  </p>
                  <Button
                    size="default"
                    variant="secondary"
                    onClick={handleLoadMore}
                    className="product-grid-load-more-button"
                  >
                    Load More Products
                  </Button>
                </div>
              )}
            </>
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
