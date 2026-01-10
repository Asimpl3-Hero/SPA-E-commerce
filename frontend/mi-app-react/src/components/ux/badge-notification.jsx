import { forwardRef } from "react";

export const BadgeNotification = forwardRef(
  ({ count = 0, max = 99, show = true, className = "", children, ...props }, ref) => {
    if (!show || count <= 0) return children;

    const displayCount = count > max ? `${max}+` : count;

    return (
      <div ref={ref} className="relative inline-flex" {...props}>
        {children}
        <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground ${className}`}>
          {displayCount}
        </span>
      </div>
    );
  }
);

BadgeNotification.displayName = "BadgeNotification";

// Dot variant for simpler notifications
export const NotificationDot = forwardRef(
  ({ show = true, pulse = false, className = "", children, ...props }, ref) => {
    if (!show) return children;

    return (
      <div ref={ref} className="relative inline-flex" {...props}>
        {children}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          {pulse && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full bg-destructive ${className}`} />
        </span>
      </div>
    );
  }
);

NotificationDot.displayName = "NotificationDot";
