import { useState } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ProductGrid } from "@/components/product-grid";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1">
        <Hero />
        <ProductGrid searchQuery={searchQuery} />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
