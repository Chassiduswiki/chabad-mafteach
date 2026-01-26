import * as React from "react"
import { cn } from "@/lib/utils"

const Empty = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in duration-500",
      className
    )}
    {...props}
  />
)

const EmptyHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col items-center gap-2", className)} {...props} />
)

const EmptyMedia = ({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "icon" }) => (
  <div
    className={cn(
      "flex items-center justify-center",
      variant === "icon" && "h-20 w-20 rounded-full bg-muted",
      className
    )}
    {...props}
  />
)

const EmptyTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("mt-4 text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
)

const EmptyDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("mt-2 text-sm text-muted-foreground", className)}
    {...props}
  />
)

const EmptyContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-6", className)} {...props} />
)

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
}
