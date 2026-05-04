import Image from "next/image";

import { cn } from "@/lib/utils/cn";

export function BrandLockup({
  title = "R-TASK MANAGEMENT",
  subtitle = "Property Solution",
  className,
  compact = false,
  hideTextOnSmall = false,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  hideTextOnSmall?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/r-task-icon-transparent.png"
        alt=""
        width={56}
        height={56}
        className={cn("object-contain", compact ? "h-10 w-10" : "h-12 w-12")}
        priority
      />
      <div className={cn("leading-tight", hideTextOnSmall ? "hidden sm:block" : "")}>
        <p className={cn("font-bold text-white", compact ? "text-xs" : "text-sm")}>
          {title}
        </p>
        <p className={cn("font-medium text-[#C9A646]", compact ? "text-xs" : "text-sm")}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
