import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_TILT_MAX_DEG = 10;
const DEFAULT_HOVER_SCALE = 1.02;
const SPRING_CONFIG = { stiffness: 300, damping: 30 } as const;
const TILT_INPUT_RANGE = [-0.5, 0.5] as const;
const PERSPECTIVE_PX = 1000;

interface CardTiltContextValue {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  scale: MotionValue<number>;
}

const CardTiltContext = React.createContext<CardTiltContextValue | null>(null);

interface CardTiltProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngle?: number;
  tiltReverse?: boolean;
  scale?: number;
}

/**
 * Outer wrapper that tracks the cursor position relative to itself and
 * publishes springed rotateX / rotateY / scale motion values through context.
 * Compose with {@link CardTiltContent} to actually apply the 3D transform to
 * a specific inner surface.
 */
export const CardTilt = React.forwardRef<HTMLDivElement, CardTiltProps>(
  (
    {
      children,
      className,
      tiltMaxAngle = DEFAULT_TILT_MAX_DEG,
      tiltReverse = false,
      scale = DEFAULT_HOVER_SCALE,
      ...props
    },
    forwardRef,
  ) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const springX = useSpring(pointerX, SPRING_CONFIG);
    const springY = useSpring(pointerY, SPRING_CONFIG);

    const rotateX = useTransform(
      springY,
      TILT_INPUT_RANGE,
      tiltReverse ? [tiltMaxAngle, -tiltMaxAngle] : [-tiltMaxAngle, tiltMaxAngle],
    );
    const rotateY = useTransform(
      springX,
      TILT_INPUT_RANGE,
      tiltReverse ? [-tiltMaxAngle, tiltMaxAngle] : [tiltMaxAngle, -tiltMaxAngle],
    );
    const scaleSpring = useSpring(1, SPRING_CONFIG);

    const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
      pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
      scaleSpring.set(scale);
    };

    const handleLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
      scaleSpring.set(1);
    };

    React.useImperativeHandle(forwardRef, () => ref.current!);

    const contextValue = React.useMemo<CardTiltContextValue>(
      () => ({ rotateX, rotateY, scale: scaleSpring }),
      [rotateX, rotateY, scaleSpring],
    );

    return (
      <CardTiltContext.Provider value={contextValue}>
        <div
          ref={ref}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className={cn("relative", className)}
          style={{ perspective: PERSPECTIVE_PX }}
          {...props}
        >
          {children}
        </div>
      </CardTiltContext.Provider>
    );
  },
);
CardTilt.displayName = "CardTilt";

/**
 * Inner surface that consumes the {@link CardTilt} context and applies the
 * springed 3D transform. Must be rendered inside a `CardTilt` parent.
 */
export const CardTiltContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const ctx = React.useContext(CardTiltContext);
  if (!ctx) throw new Error("CardTiltContent must be used within CardTilt");
  return (
    <motion.div
      ref={ref}
      style={{
        rotateX: ctx.rotateX,
        rotateY: ctx.rotateY,
        scale: ctx.scale,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative h-full w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});
CardTiltContent.displayName = "CardTiltContent";
