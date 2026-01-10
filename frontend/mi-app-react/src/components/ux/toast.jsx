import { forwardRef, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: "bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800",
  error: "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800",
  info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800",
  warning: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-800",
};

const toastIconStyles = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-yellow-600 dark:text-yellow-400",
};

export const Toast = forwardRef(
  ({
    type = "info",
    title,
    message,
    onClose,
    autoClose = true,
    duration = 5000,
    className = ""
  }, ref) => {
    const Icon = toastIcons[type];
    const styleClass = toastStyles[type] || toastStyles.info;
    const iconStyleClass = toastIconStyles[type] || toastIconStyles.info;

    useEffect(() => {
      if (autoClose && onClose) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }, [autoClose, duration, onClose]);

    return (
      <div
        ref={ref}
        className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-right ${styleClass} ${className}`}
        role="alert"
      >
        {Icon && <Icon className={`h-5 w-5 flex-shrink-0 ${iconStyleClass}`} />}

        <div className="flex-1 space-y-1">
          {title && <p className="font-semibold text-sm">{title}</p>}
          {message && <p className="text-sm opacity-90">{message}</p>}
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0 opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

Toast.displayName = "Toast";

// Toast Container for positioning multiple toasts
export const ToastContainer = ({ children, position = "top-right" }) => {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]}`}>
      {children}
    </div>
  );
};
