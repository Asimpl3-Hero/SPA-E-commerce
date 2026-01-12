import { forwardRef } from "react";

export const Card = forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`card-base ${className}`}
    {...props}
  />
));
Card.displayName = "Card";

export const CardContent = forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`card-content ${className}`} {...props} />
));
CardContent.displayName = "CardContent";
