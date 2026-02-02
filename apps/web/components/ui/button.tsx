import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "default",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 ease-[cubic-bezier(0.215,0.61,0.355,1)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        {
          "border-b border-text text-text hover:opacity-50":
            variant === "default",
          "border border-border text-text hover:bg-bg-secondary":
            variant === "outline",
          "text-text-secondary hover:text-text":
            variant === "ghost",
        },
        {
          "px-3 py-1 text-[13px]": size === "sm",
          "px-5 py-2 text-sm": size === "md",
          "px-8 py-3 text-sm": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
