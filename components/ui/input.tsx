import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-[#cbd5e1] focus:border-[var(--tenant-accent,#C9A646)] focus:bg-[#fffdfa] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--tenant-accent,#C9A646)_14%,transparent)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
