import { useState } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ProductGrid } from "@/components/product-grid";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { useDebounce } from "@/hooks/useDebounce";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  return (
    <div className="min-h-screen flex flex-col">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1">
        <Hero />
        <ProductGrid searchQuery={debouncedSearchQuery} />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
