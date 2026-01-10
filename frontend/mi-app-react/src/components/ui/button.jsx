import { forwardRef } from "react";

const buttonVariants = {
  default: "btn-default",
  destructive: "btn-destructive",
  outline: "btn-outline",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  link: "btn-link",
};

const buttonSizes = {
  default: "btn-size-default",
  sm: "btn-size-sm",
  lg: "btn-size-lg",
  icon: "btn-size-icon",
};

export const Button = forwardRef(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = buttonVariants[variant] || buttonVariants.default;
    const sizeClass = buttonSizes[size] || buttonSizes.default;

    if (asChild && children) {
      return children;
    }

    return (
      <button
        className={`btn-base ${variantClass} ${sizeClass} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
