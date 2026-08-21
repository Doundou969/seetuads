import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-primary-600 text-white hover:bg-primary-700 px-4 py-2",
          variant === "outline" && "border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-gray-700",
          variant === "ghost" && "hover:bg-gray-100 px-2 py-1 text-gray-700",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-11 px-8",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
