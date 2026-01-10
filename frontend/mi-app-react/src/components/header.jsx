import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleCart, selectTotalItems } from "@/store/cartSlice";
import "@/styles/components/header.css";

export function Header({ searchQuery, onSearchChange }) {
  const dispatch = useDispatch();
  const totalItems = useSelector(selectTotalItems);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo & Navigation */}
        <div className="header-left">
          <a href="/" className="header-logo">
            <span className="header-logo-text">TechVault</span>
          </a>

          <nav className="header-nav">
            <a href="#products" className="header-nav-link">
              Products
            </a>
            <a href="#" className="header-nav-link">
              Deals
            </a>
            <a href="#" className="header-nav-link">
              Support
            </a>
          </nav>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="header-search">
          <div className="header-search-wrapper">
            <Search className="header-search-icon" />
            <Input
              type="search"
              placeholder="Search products..."
              className="header-search-input input-base"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="header-actions">
          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="header-cart-button"
            onClick={() => dispatch(toggleCart())}
            aria-label="Open cart"
          >
            <ShoppingCart className="header-icon" />
            {totalItems > 0 && (
              <span className="header-cart-badge">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="header-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="header-icon" />
            ) : (
              <Menu className="header-icon" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="header-mobile-menu">
          {/* Mobile Search */}
          <div className="header-mobile-search">
            <Search className="header-search-icon" />
            <Input
              type="search"
              placeholder="Search products..."
              className="header-search-input input-base"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Mobile Navigation */}
          <nav className="header-mobile-nav">
            <a href="#products" className="header-mobile-nav-link">
              Products
            </a>
            <a href="#" className="header-mobile-nav-link">
              Deals
            </a>
            <a href="#" className="header-mobile-nav-link">
              Support
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
