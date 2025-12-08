"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

export function IconButton({
  label,
  active = false,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      aria-label={props["aria-label"] ?? label}
      title={props.title ?? label}
      className={cn(
        "group relative flex h-11 w-11 items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}
