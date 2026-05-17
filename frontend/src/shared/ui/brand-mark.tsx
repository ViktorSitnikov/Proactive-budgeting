"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { BRAND } from "@/src/shared/config/brand"

interface BrandMarkProps {
  className?: string
  /** Подпись под названием (роль, раздел) */
  tagline?: string
  showText?: boolean
  logoClassName?: string
  compact?: boolean
}

export function BrandMark({
  className,
  tagline,
  showText = true,
  logoClassName,
  compact = false,
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3 min-w-0", className)}>
      <Image
        src={BRAND.logoPath}
        alt={BRAND.logoAlt}
        width={compact ? 36 : 44}
        height={compact ? 34 : 42}
        className={cn("h-9 w-auto shrink-0 sm:h-10", logoClassName)}
        priority
      />
      {showText && (
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "font-bold tracking-tight text-foreground truncate",
              compact ? "text-lg" : "text-xl md:text-2xl"
            )}
          >
            {BRAND.name}
          </p>
          {(tagline || BRAND.tagline) && (
            <p className="text-[10px] sm:text-xs uppercase font-semibold text-muted-foreground tracking-wide truncate">
              {tagline ?? BRAND.tagline}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
