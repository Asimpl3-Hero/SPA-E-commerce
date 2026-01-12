import { useState, useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductGrid } from "@/components/product-grid";
import { AboutSection } from "@/components/about-section";
import { ProductModal } from "@/components/product-modal";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { useDebounce } from "@/hooks/useDebounce";
import { getAllProducts } from "@/services/productService";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
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
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onProductClick={handleProductClick}
        />
        <main className="flex-1">
          <Hero />
          <ProductCarousel products={products} onProductClick={handleProductClick} />
          <ProductGrid searchQuery={debouncedSearchQuery} />
          <AboutSection />
        </main>
        <Footer />
        <CartDrawer />
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </ThemeProvider>
  );
}
