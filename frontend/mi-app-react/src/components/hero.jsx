import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import "@/styles/components/hero.css";

export function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge-wrapper">
              <span className="hero-badge">
                New Arrivals 2025
              </span>
            </div>
            <h1 className="hero-title">
              Discover the Future of Tech
            </h1>
            <p className="hero-description">
              Premium electronics and gadgets curated for those who demand the
              best. Free shipping on orders over $99.
            </p>
            <div className="hero-buttons">
              <Button size="lg" className="gap-2" asChild>
                <a href="#products">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline">
                View Deals
              </Button>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="hero-image-container">
              <img
                src="/premium-tech-gadgets-collection-headphones-smartwa.jpg"
                alt="Featured tech products"
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
