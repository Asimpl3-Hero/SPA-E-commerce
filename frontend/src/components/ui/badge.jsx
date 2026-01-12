import { forwardRef } from "react";

// Badge variant class mappings
const badgeVariants = {
  default: "badge-default",
  secondary: "badge-secondary",
  destructive: "badge-destructive",
  outline: "badge-outline",
  success: "badge-success",
  warning: "badge-warning",
  info: "badge-info",
  new: "badge-new",
  sale: "badge-sale",
};

/**
 * Badge Component
 *
 * A flexible badge component with multiple variants for different use cases.
 *
 * @param {string} variant - The badge style variant (default, secondary, destructive, outline, success, warning, info, new, sale)
 * @param {string} className - Additional CSS classes
 */
export const Badge = forwardRef(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variantClass = badgeVariants[variant] || badgeVariants.default;

    return (
      <div
        ref={ref}
        className={`badge-base ${variantClass} ${className}`}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
