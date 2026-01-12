import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchProducts } from "@/services/productService";
import { useDebounce } from "@/hooks/useDebounce";
import "@/styles/components/search-with-suggestions.css";

export function SearchWithSuggestions({ searchQuery, onSearchChange, onProductClick }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await searchProducts(debouncedQuery);

        if (Array.isArray(results) && results.length > 0) {
          setSuggestions(results.slice(0, 5)); // Show max 5 suggestions
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(true); // Show empty state
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    onSearchChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (product) => {
    onSearchChange(product.name);
    setShowSuggestions(false);
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="search-suggestions-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <Search className="search-icon" />
        <Input
          type="search"
          placeholder="Buscar productos..."
          className="search-input input-base"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          <div className="suggestions-header">
            <span className="suggestions-title">Sugerencias</span>
            <span className="suggestions-count">
              {suggestions.length} {suggestions.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
          <ul className="suggestions-list">
            {suggestions.map((product, index) => (
              <li
                key={product.id}
                className={`suggestion-item ${
                  index === selectedIndex ? "suggestion-item-selected" : ""
                }`}
                onClick={() => handleSuggestionClick(product)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="suggestion-image-wrapper">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="suggestion-image"
                    loading="lazy"
                  />
                </div>
                <div className="suggestion-content">
                  <div className="suggestion-name">{product.name}</div>
                  <div className="suggestion-meta">
                    <span className="suggestion-category">{product.category}</span>
                    <span className="suggestion-price">{formatPrice(product.price)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && debouncedQuery.trim().length >= 2 && suggestions.length === 0 && (
        <div className="suggestions-dropdown">
          <div className="suggestions-empty">
            <Search className="suggestions-empty-icon" />
            <p className="suggestions-empty-text">No se encontraron productos</p>
            <p className="suggestions-empty-hint">Intenta con otros términos de búsqueda</p>
          </div>
        </div>
      )}
    </div>
  );
}
