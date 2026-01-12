import { Button } from "@/components/ui/button";
import "@/styles/components/about-section.css";

export function AboutSection() {
  return (
    <section className="about-section">
      <div className="about-container">
        <div className="about-content">
          {/* Image */}
          <div className="about-image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80"
              alt="Tech workspace"
              className="about-image"
            />
          </div>

          {/* Text Content */}
          <div className="about-text">
            <h2 className="about-title">Innovación en Tecnología</h2>

            <div className="about-description">
              <p className="about-paragraph">
                <strong>TechVault</strong> nació de la pasión por la tecnología y el compromiso de
                hacer accesible la innovación a todos. Desde 2020, hemos dedicado nuestro
                esfuerzo a ofrecer productos tecnológicos de alta calidad que transforman
                la forma en que trabajas, creas y te diviertes.
              </p>

              <p className="about-paragraph">
                Cada producto es cuidadosamente seleccionado y cada experiencia es
                diseñada con dedicación, porque sabemos que detrás de cada
                compra hay un proyecto, un sueño o una meta que merece las mejores herramientas.
              </p>
            </div>

            <Button
              size="lg"
              className="about-cta"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Conoce Nuestra Historia
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
