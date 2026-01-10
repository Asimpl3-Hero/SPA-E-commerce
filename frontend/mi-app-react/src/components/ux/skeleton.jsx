import { forwardRef } from "react";

export const Skeleton = forwardRef(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseClasses = "animate-pulse bg-muted rounded-md";

    const variantClasses = {
      default: "h-4 w-full",
      circle: "rounded-full",
      text: "h-4",
      title: "h-6",
      avatar: "h-12 w-12 rounded-full",
      card: "h-64 w-full",
    };

    const variantClass = variantClasses[variant] || variantClasses.default;

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClass} ${className}`}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Skeleton presets for common patterns
export const SkeletonCard = ({ className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    <Skeleton variant="card" />
    <Skeleton variant="title" className="w-3/4" />
    <Skeleton variant="text" className="w-full" />
    <Skeleton variant="text" className="w-5/6" />
  </div>
);

export const SkeletonProductCard = ({ className = "" }) => (
  <div className={`border rounded-lg p-4 space-y-3 ${className}`}>
    <Skeleton className="aspect-square w-full" />
    <Skeleton variant="text" className="w-2/3" />
    <Skeleton variant="title" className="w-4/5" />
    <Skeleton variant="text" className="w-1/2" />
    <div className="flex justify-between items-center">
      <Skeleton variant="text" className="w-20 h-6" />
      <Skeleton variant="text" className="w-16 h-9" />
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={i === lines - 1 ? "w-4/5" : "w-full"}
      />
    ))}
  </div>
);
