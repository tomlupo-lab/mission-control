import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent",
        live: "",
        paper: "",
        success: "",
        destructive: "",
        secondary: "",
        outline: "border-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: "rgba(85,94,126,0.1)", borderColor: "rgba(85,94,126,0.2)", color: "var(--muted-hex)" },
  live: { background: "var(--green-dim)", borderColor: "rgba(0,229,200,0.25)", color: "var(--green)" },
  paper: { background: "var(--orange-dim)", borderColor: "rgba(255,184,77,0.25)", color: "var(--orange)" },
  success: { background: "var(--green-dim)", borderColor: "rgba(0,229,200,0.25)", color: "var(--green)" },
  destructive: { background: "var(--red-dim)", borderColor: "rgba(255,107,107,0.25)", color: "var(--red)" },
  secondary: { background: "var(--purple-dim)", borderColor: "rgba(123,97,255,0.25)", color: "var(--purple)" },
  outline: {},
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      style={{ ...variantStyles[variant || "default"], ...style }}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
