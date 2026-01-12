import "@/styles/components/footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Footer Grid */}
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <span className="footer-brand-name">TechVault</span>
            <p className="footer-brand-description">
              Electrónicos premium para quienes exigen lo mejor.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="footer-section-title">Tienda</h3>
            <ul className="footer-links">
              <li>
                <a href="#" className="footer-link">
                  Todos los Productos
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Nuevos Ingresos
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Más Vendidos
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Ofertas
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="footer-section-title">Soporte</h3>
            <ul className="footer-links">
              <li>
                <a href="#" className="footer-link">
                  Contáctanos
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Envíos
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Devoluciones
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="footer-section-title">Compañía</h3>
            <ul className="footer-links">
              <li>
                <a href="#" className="footer-link">
                  Acerca de
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Carreras
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Prensa
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; 2025 TechVault. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
