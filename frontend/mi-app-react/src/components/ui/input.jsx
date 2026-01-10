import { forwardRef } from "react";

export const Input = forwardRef(({ className = "", type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={`input-base ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
