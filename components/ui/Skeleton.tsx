import * as React from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  /** circle = avatar/icon placeholder; rect = generic block; text = pill-shape line */
  shape?: "rect" | "circle" | "text";
  /** Shimmer animation (default true). */
  animated?: boolean;
}

export function Skeleton({
  width,
  height,
  shape = "rect",
  animated = true,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const radius =
    shape === "circle"
      ? "rounded-full"
      : shape === "text"
      ? "rounded-full"
      : "rounded-[var(--radius-md)]";

  const baseHeight =
    shape === "text" ? "0.7rem" : shape === "circle" ? "2rem" : "1rem";

  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-[var(--surface-2)]",
        radius,
        animated && "before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)] before:bg-[length:200%_100%] before:[animation:ges-shimmer_1.4s_ease_infinite]",
        className,
      )}
      style={{
        width: width ?? "100%",
        height: height ?? baseHeight,
        ...style,
      }}
      {...rest}
    />
  );
}
