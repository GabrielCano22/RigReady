import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

const GRID_SIZE_PX = 40;
const TOTAL_GRID_LINES = 35;
const MIN_BEAMS_PER_BURST = 3;
const MAX_BEAMS_PER_BURST = 4;
const MIN_BEAM_DURATION_S = 4;
const BEAM_DURATION_JITTER_S = 1.5;
const BURST_OVERLAP_S = 0.5;
const BEAM_GRADIENT =
  "linear-gradient(to top, #00ffff 0%, #00d4ff 40%, transparent 100%)";
const GRID_GRADIENT =
  "linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #072b36 1px, transparent 1px)";
const VIGNETTE_MASK =
  "radial-gradient(ellipse at center, transparent 20%, black)";

interface Beam {
  id: number;
  x: number;
  duration: number;
}

interface BackgroundMeteorsProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Picks up to `count` grid column indices such that no two chosen columns are
 * adjacent. Keeps the beam burst visually spread out instead of clumping.
 */
function pickSpacedColumns(count: number): number[] {
  const available = Array.from({ length: TOTAL_GRID_LINES - 1 }, (_, i) => i);
  const selected: number[] = [];
  while (available.length > 0 && selected.length < count) {
    const idx = Math.floor(Math.random() * available.length);
    const value = available[idx];
    selected.push(value);
    available.splice(
      0,
      available.length,
      ...available.filter((v) => Math.abs(v - value) > 1),
    );
  }
  return selected.map((line) => line * GRID_SIZE_PX);
}

function randomBurstSize(): number {
  const span = MAX_BEAMS_PER_BURST - MIN_BEAMS_PER_BURST + 1;
  return Math.floor(Math.random() * span) + MIN_BEAMS_PER_BURST;
}

function makeBeam(x: number): Beam {
  return {
    id: Math.random(),
    x,
    duration: MIN_BEAM_DURATION_S + Math.random() * BEAM_DURATION_JITTER_S,
  };
}

/**
 * Grid + falling cyan beams painted behind hero/about panels. Absolutely
 * positioned — the parent element must establish a positioning context and
 * clip overflow.
 */
export function BackgroundMeteors({ children, className }: BackgroundMeteorsProps) {
  const [beams, setBeams] = useState<Beam[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNextBurst = () => {
      const next = pickSpacedColumns(randomBurstSize()).map(makeBeam);
      setBeams(next);
      const longestBeamMs = Math.max(...next.map((b) => b.duration)) * 1000;
      timer = setTimeout(scheduleNextBurst, longestBeamMs - BURST_OVERLAP_S * 1000);
    };
    scheduleNextBurst();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundSize: `${GRID_SIZE_PX}px ${GRID_SIZE_PX}px`,
          backgroundImage: GRID_GRADIENT,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: VIGNETTE_MASK,
          maskImage: VIGNETTE_MASK,
          background: "#0a0a0a",
        }}
      />
      {beams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute top-0"
          style={{ left: beam.x, zIndex: 2 }}
          initial={{ y: -150 }}
          animate={{ y: "100vh" }}
          transition={{ duration: beam.duration, ease: "linear" }}
        >
          <div
            className="h-14 w-px rounded-full"
            style={{ margin: "0 auto", background: BEAM_GRADIENT }}
          />
        </motion.div>
      ))}
      {children}
    </div>
  );
}

export default BackgroundMeteors;
