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
              Premium electronics for those who demand the best.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="footer-section-title">Shop</h3>
            <ul className="footer-links">
              <li>
                <a href="#" className="footer-link">
                  All Products
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Best Sellers
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Sale
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="footer-section-title">Support</h3>
            <ul className="footer-links">
              <li>
                <a href="#" className="footer-link">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Shipping
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Returns
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="footer-section-title">Company</h3>
            <ul className="footer-links">
              <li>
                <a href="#" className="footer-link">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Press
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; 2025 TechVault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
