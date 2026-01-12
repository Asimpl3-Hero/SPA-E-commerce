import { useEffect, useState } from "react";
import "@/styles/components/categories-section.css";

export function CategoriesSection() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch categories from API
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4567/api"}/categories`);
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryIcon = (slug) => {
    const icons = {
      audio: "🎧",
      wearables: "⌚",
      gaming: "🎮",
      cameras: "📷",
      storage: "💾",
      peripherals: "⌨️"
    };
    return icons[slug] || "📦";
  };

  const getCategoryDescription = (slug) => {
    const descriptions = {
      audio: "Experiencia de sonido premium con la última tecnología en audio",
      wearables: "Tecnología inteligente que se adapta a tu estilo de vida",
      gaming: "Equipamiento profesional para llevar tu juego al siguiente nivel",
      cameras: "Captura momentos inolvidables con calidad profesional",
      storage: "Soluciones de almacenamiento rápidas y confiables",
      peripherals: "Accesorios esenciales para mejorar tu productividad"
    };
    return descriptions[slug] || "Explora nuestra selección de productos";
  };

  return (
    <section className="categories-section">
      <div className="categories-container">
        <div className="categories-header">
          <h2 className="categories-title">Explora Categorías</h2>
          <p className="categories-subtitle">
            Rutas especializadas para profesionales modernos
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#products?category=${category.slug}`}
              className="category-card"
            >
              <div className="category-icon">
                {getCategoryIcon(category.slug)}
              </div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">
                {getCategoryDescription(category.slug)}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
