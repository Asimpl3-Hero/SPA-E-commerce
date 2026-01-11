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
              <span className="hero-badge">Edición 2026</span>
            </div>

            {/* Title */}
            <h1 className="hero-title">El siguiente nivel en innovación</h1>

            {/* Description */}
            <p className="hero-description">
              Dispositivos diseñados para el presente, creados para el futuro.
              Tecnología que se adapta a tu estilo de vida.
            </p>

            {/* Action Buttons */}
            <div className="hero-buttons">
              <Button size="lg" className="hero-button-primary" asChild>
                <Button size="lg" variant="outline">
                  Compra ahora
                </Button>
              </Button>
              <Button size="lg" variant="outline">
                Acerca de
              </Button>
            </div>
          </div>

          {/* Hero Video */}
          <div className="hero-image-wrapper">
            <div className="hero-image-container">
              <video
                src="https://cdn.pixabay.com/video/2019/09/06/26619-359604050_large.mp4"
                className="hero-image"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
