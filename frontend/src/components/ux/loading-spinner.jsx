import { forwardRef } from "react";

const spinnerSizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

const spinnerVariants = {
  primary: "border-primary border-r-transparent",
  secondary: "border-secondary border-r-transparent",
  white: "border-white border-r-transparent",
};

export const LoadingSpinner = forwardRef(
  ({ size = "md", variant = "primary", className = "", ...props }, ref) => {
    const sizeClass = spinnerSizes[size] || spinnerSizes.md;
    const variantClass = spinnerVariants[variant] || spinnerVariants.primary;

    return (
      <div
        ref={ref}
        className={`inline-block animate-spin rounded-full ${sizeClass} ${variantClass} ${className}`}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";
