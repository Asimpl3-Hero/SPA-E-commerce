import { forwardRef } from "react";

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
