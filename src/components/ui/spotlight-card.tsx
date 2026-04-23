import * as React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_SPOTLIGHT_RGB = "0, 255, 255";
const SPOTLIGHT_RADIUS_PX = 320;
const SPOTLIGHT_ALPHA = 0.18;

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** RGB triplet, e.g. `"0, 255, 255"` for cyan. Alpha is applied by us. */
  spotlightColor?: string;
  children: React.ReactNode;
}

/**
 * Bare `<div>` wrapper with a cursor-following radial glow revealed on hover.
 * Deliberately not built on top of `Card` so consumers control every surface
 * style (border, padding, background) themselves.
 */
export function SpotlightCard({
  spotlightColor = DEFAULT_SPOTLIGHT_RGB,
  children,
  className,
  style,
  onMouseMove,
  ...props
}: SpotlightCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const backgroundImage = useMotionTemplate`radial-gradient(${SPOTLIGHT_RADIUS_PX}px circle at ${x}px ${y}px, rgba(${spotlightColor}, ${SPOTLIGHT_ALPHA}), transparent 70%)`;

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - left);
    y.set(event.clientY - top);
    onMouseMove?.(event);
  };

  return (
    <div
      className={cn("group relative overflow-hidden", className)}
      onMouseMove={handleMove}
      style={style}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundImage }}
      />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

export default SpotlightCard;
