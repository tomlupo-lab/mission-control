import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "live" | "paper" | "success" | "destructive";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className, ...props }, ref) => {
    const variantClass =
      variant === "live" ? "pill pill-green" :
      variant === "paper" ? "pill pill-orange" :
      variant === "success" ? "pill pill-green" :
      variant === "destructive" ? "pill pill-red" :
      "pill pill-muted";
    return <span ref={ref} className={`${variantClass} ${className ?? ""}`} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge };
