import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import "@/styles/components/theme-toggle.css";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Sun className="theme-toggle-icon theme-toggle-sun" />
      <Moon className="theme-toggle-icon theme-toggle-moon" />
    </button>
  );
};
