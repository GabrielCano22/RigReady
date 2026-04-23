import * as React from "react";
import {
  motion,
  useAnimation,
  useInView,
  type AnimationControls,
  type Easing,
} from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_DURATION_S = 0.8;
const DEFAULT_STAGGER_S = 0.1;
const EASING: Easing = [0.76, 0, 0.24, 1];
const BOX_BASE_CLASS = "absolute inset-0 z-10 bg-primary";

type Direction = "up" | "down" | "left" | "right";
type Mode = "manual" | "auto";

interface RevealAnim {
  initial: Record<string, number>;
  animate: Record<string, number>;
}

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  boxClassName?: string;
  delay?: number;
  duration?: number;
  direction?: Direction;
  mode?: Mode;
  stagger?: number;
  once?: boolean;
}

/**
 * Maps a reveal `direction` to the pair of framer-motion variants that scale
 * the covering box away from the opposite edge.
 */
function animForDirection(direction: Direction): RevealAnim {
  switch (direction) {
    case "up":
      return { initial: { scaleY: 1, originY: 0 }, animate: { scaleY: 0 } };
    case "down":
      return { initial: { scaleY: 1, originY: 1 }, animate: { scaleY: 0 } };
    case "left":
      return { initial: { scaleX: 1, originX: 0 }, animate: { scaleX: 0 } };
    case "right":
      return { initial: { scaleX: 1, originX: 1 }, animate: { scaleX: 0 } };
  }
}

interface RevealSegmentProps {
  anim: RevealAnim;
  controls: AnimationControls;
  delay: number;
  duration: number;
  boxClassName?: string;
  textClassName?: string;
  children: React.ReactNode;
}

/**
 * Single "cover then fade in" segment used for both the whole-child render
 * path and the auto word-splitting path.
 */
function RevealSegment({
  anim,
  controls,
  delay,
  duration,
  boxClassName,
  textClassName,
  children,
}: RevealSegmentProps) {
  return (
    <>
      <motion.span
        variants={{ initial: anim.initial, animate: anim.animate }}
        initial="initial"
        animate={controls}
        transition={{ delay, duration, ease: EASING }}
        className={cn(BOX_BASE_CLASS, boxClassName)}
      />
      <motion.span
        variants={{ initial: { opacity: 0 }, animate: { opacity: 1 } }}
        initial="initial"
        animate={controls}
        transition={{ delay: delay + duration * 0.5, duration: duration * 0.5 }}
        className={textClassName}
      >
        {children}
      </motion.span>
    </>
  );
}

/**
 * Scroll-triggered text reveal: a solid box slides away to expose the
 * underlying text, which simultaneously fades in. In `mode="auto"` with a
 * string child, each word becomes its own staggered segment.
 */
export function RevealText({
  children,
  className = "",
  boxClassName = "",
  delay = 0,
  duration = DEFAULT_DURATION_S,
  direction = "down",
  mode = "manual",
  stagger = DEFAULT_STAGGER_S,
  once = true,
}: RevealTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once });
  const controls = useAnimation();
  const anim = animForDirection(direction);

  React.useEffect(() => {
    if (inView) {
      controls.set("initial");
      controls.start("animate");
    } else if (!once) {
      controls.start("initial");
    }
  }, [inView, controls, once]);

  if (mode === "auto" && typeof children === "string") {
    return (
      <span ref={ref} className="inline-block">
        {children.split(" ").map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="relative mr-2 inline-block overflow-hidden"
          >
            <RevealSegment
              anim={anim}
              controls={controls}
              delay={delay + index * stagger}
              duration={duration}
              boxClassName={boxClassName}
              textClassName={className}
            >
              {word}
            </RevealSegment>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span ref={ref} className="relative inline-block overflow-hidden">
      <RevealSegment
        anim={anim}
        controls={controls}
        delay={delay}
        duration={duration}
        boxClassName={boxClassName}
        textClassName={className}
      >
        {children}
      </RevealSegment>
    </span>
  );
}

export default RevealText;
