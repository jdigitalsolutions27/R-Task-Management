import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-semibold transition-all duration-200 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-4 active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      size: {
        default: "h-10 px-4.5",
        lg: "h-11 px-5.5",
        sm: "h-9 px-3 text-xs",
      },
      variant: {
        default:
          "border-[var(--tenant-accent,#C9A646)] bg-[var(--tenant-accent,#C9A646)] text-[var(--tenant-accent-foreground,#111827)] shadow-[0_14px_34px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:border-[var(--tenant-accent-hover,#B8933A)] hover:bg-[var(--tenant-accent-hover,#B8933A)] hover:shadow-[0_22px_44px_rgba(15,23,42,0.2)] focus-visible:ring-[color-mix(in_srgb,var(--tenant-accent,#C9A646)_22%,transparent)]",
        outline:
          "border-[#CBD5E1] bg-white text-[#111827] shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-[var(--tenant-accent,#C9A646)] hover:bg-[var(--tenant-accent-soft,#fdf9ed)] hover:shadow-[0_18px_34px_rgba(15,23,42,0.1)] focus-visible:ring-[color-mix(in_srgb,var(--tenant-accent,#C9A646)_22%,transparent)]",
        ghost:
          "border-transparent bg-transparent text-[#6B7280] hover:bg-[var(--tenant-accent-soft,#F1EFEA)] hover:text-[#111827] focus-visible:ring-[color-mix(in_srgb,var(--tenant-accent,#C9A646)_22%,transparent)]",
        danger:
          "border-[#b91c1c] bg-[#b91c1c] text-white shadow-[0_10px_22px_rgba(185,28,28,0.2)] hover:-translate-y-0.5 hover:border-[#991b1b] hover:bg-[#991b1b] focus-visible:ring-[rgba(185,28,28,0.22)]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";
