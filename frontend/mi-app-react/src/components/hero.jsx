import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import "@/styles/components/hero.css";

export function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-grid">
          {/* Hero Content */}
          <div className="hero-content">
            {/* Badge */}
            <div className="hero-badge-wrapper">
              <span className="hero-badge">
                New Arrivals 2025
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-title">
              Discover the Future of Tech
            </h1>

            {/* Description */}
            <p className="hero-description">
              Premium electronics and gadgets curated for those who demand the
              best. Free shipping on orders over $99.
            </p>

            {/* Action Buttons */}
            <div className="hero-buttons">
              <Button size="lg" className="hero-button-primary" asChild>
                <a href="#products">
                  Shop Now
                  <ArrowRight className="hero-button-icon" />
                </a>
              </Button>
              <Button size="lg" variant="outline">
                View Deals
              </Button>
            </div>
          </div>

          {/* Hero Image */}
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
