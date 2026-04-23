import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
  type Easing,
} from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_EASING: Easing = [0.22, 1, 0.36, 1];
const DEFAULT_DELAY = 0.05;
const DEFAULT_DURATION = 1;
const TOUCH_AUTOPLAY_START_MS = 1_000;
const TOUCH_AUTOPLAY_PERIOD_MS = 2_000;
const PERSPECTIVE_PX = 1000;

type Direction = "up" | "down" | "alternate";

interface StaggerCharsProps {
  text: string;
  hoverText?: string;
  delay?: number;
  duration?: number;
  className?: string;
  hoverClassName?: string;
  direction?: Direction;
  easing?: Easing;
  disabled?: boolean;
}

interface CharStackCustom {
  index: number;
  isEven: boolean;
}

interface AlignedChars {
  safeBase: string[];
  safeHover: string[];
}

/**
 * Pads the shorter of `text` / `hoverText` with spaces so both strings
 * produce the same number of char slots — required for a stable transition.
 */
function alignCharArrays(text: string, hoverText?: string): AlignedChars {
  const base = text.split("");
  const hover = (hoverText ?? text).split("");
  const length = Math.max(base.length, hover.length);
  return {
    safeBase: Array.from({ length }, (_, i) => base[i] ?? " "),
    safeHover: Array.from({ length }, (_, i) => hover[i] ?? " "),
  };
}

/** Detects whether the current device exposes a touch input. */
function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = React.useState(false);
  React.useEffect(() => {
    const check = () =>
      setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isTouch;
}

/**
 * On touch devices where hover is unavailable, cycles the animation
 * automatically so the effect is still discoverable. No-op on pointer devices.
 */
function useTouchAutoplay(active: boolean): boolean {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    if (!active) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const startDelay = setTimeout(() => {
      setOn(true);
      interval = setInterval(() => setOn((prev) => !prev), TOUCH_AUTOPLAY_PERIOD_MS);
    }, TOUCH_AUTOPLAY_START_MS);
    return () => {
      clearTimeout(startDelay);
      if (interval) clearInterval(interval);
    };
  }, [active]);
  return on;
}

function initialY(direction: Direction, isEven: boolean): string {
  if (direction === "up") return "0%";
  if (direction === "down") return "-50%";
  return isEven ? "-50%" : "0%";
}

function targetY(direction: Direction, isEven: boolean): string {
  if (direction === "up") return "-50%";
  if (direction === "down") return "0%";
  return isEven ? "0%" : "-50%";
}

/**
 * Per-character flip animation used in the hero headline. Each character
 * lives in a 1em-tall clip; on hover (or touch autoplay) the stack slides to
 * reveal the `hoverText` variant.
 */
export function StaggerChars({
  text,
  hoverText,
  hoverClassName,
  delay = DEFAULT_DELAY,
  duration = DEFAULT_DURATION,
  className,
  direction = "alternate",
  easing = DEFAULT_EASING,
  disabled = false,
}: StaggerCharsProps) {
  const { safeBase, safeHover } = React.useMemo(
    () => alignCharArrays(text, hoverText),
    [text, hoverText],
  );
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const autoplay = useTouchAutoplay(isTouch && !disabled);

  const containerVariants: Variants = {
    initial: {},
    hover: { transition: { staggerChildren: reduced ? 0 : delay } },
    exit: {},
  };

  const stackVariants: Variants = {
    initial: (custom: CharStackCustom) =>
      reduced ? { y: "0%" } : { y: initialY(direction, custom.isEven) },
    hover: (custom: CharStackCustom) =>
      reduced
        ? { y: "0%" }
        : {
            y: targetY(direction, custom.isEven),
            transition: { duration, delay: custom.index * delay, ease: easing },
          },
    exit: (custom: CharStackCustom) =>
      reduced ? { y: "0%" } : { y: initialY(direction, custom.isEven) },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.span
        className={cn(
          "relative inline-block leading-none transform-gpu will-change-transform",
          !disabled && "cursor-pointer",
          className,
        )}
        variants={containerVariants}
        initial="initial"
        exit="exit"
        whileHover={disabled || isTouch ? undefined : "hover"}
        animate={isTouch && !disabled ? (autoplay ? "hover" : "initial") : undefined}
        style={{ perspective: PERSPECTIVE_PX }}
        aria-label={text}
      >
        {safeBase.map((char, index) => {
          const nextChar = safeHover[index];
          const isSpace = char === " " && nextChar === " ";
          const isEven = index % 2 === 0;
          return (
            <span
              key={index}
              className="relative inline-block h-[1em] overflow-hidden align-baseline transform-gpu will-change-transform"
              style={{ lineHeight: 1 }}
              aria-hidden="true"
            >
              <motion.span
                className="relative block"
                variants={stackVariants}
                custom={{ index, isEven } satisfies CharStackCustom}
                style={{
                  backfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                  lineHeight: 1,
                }}
              >
                {isEven && (
                  <span
                    className={cn("block h-[1em] leading-none", hoverClassName)}
                    style={{ lineHeight: 1 }}
                  >
                    {isSpace ? "\u00A0" : nextChar}
                  </span>
                )}
                <span className="block h-[1em] leading-none" style={{ lineHeight: 1 }}>
                  {isSpace ? "\u00A0" : char}
                </span>
                {!isEven && (
                  <span
                    className={cn("block h-[1em] leading-none", hoverClassName)}
                    style={{ lineHeight: 1 }}
                  >
                    {isSpace ? "\u00A0" : nextChar}
                  </span>
                )}
              </motion.span>
            </span>
          );
        })}
      </motion.span>
    </AnimatePresence>
  );
}

export default StaggerChars;
