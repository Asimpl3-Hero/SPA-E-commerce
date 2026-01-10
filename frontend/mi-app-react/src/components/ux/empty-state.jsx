import { forwardRef } from "react";
import { Button } from "@/components/ui/button";

export const EmptyState = forwardRef(
  ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel,
    className = ""
  }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      >
        {Icon && (
          <div className="mb-4 rounded-full bg-secondary p-6">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        {title && (
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
        )}

        {description && (
          <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        )}

        {action && actionLabel && (
          <Button onClick={action}>{actionLabel}</Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
