import * as React from "react";
import { cn } from "@/lib/utils";

const DEFAULT_PARTICLE_RGB = "0, 255, 255";
const DEFAULT_PARTICLE_SIZE_PX = 2;
const DEFAULT_GLOW_INTENSITY = 0.3;
const DEFAULT_HOVER_GLOW_INTENSITY = 0.5;
const DEFAULT_ANIMATION_SPEED = 3;
const DEFAULT_HOVER_RADIUS_PCT = 10;

const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const AUTO_HOVER_ANGULAR_STEP = 0.01;
const AUTO_HOVER_ORBIT_RADIUS = 0.3;

const BASE_OPACITY_MIN = 0.2;
const BASE_OPACITY_JITTER = 0.1;
const PARTICLE_BLUR_MULTIPLIER = 3;
const HOVERED_BLUR_MULTIPLIER = 5;
const AUTO_HOVER_OPACITY_BOOST = 0.6;
const AUTO_HOVER_SIZE_BOOST = 0.5;
const CURSOR_OPACITY_BOOST = 0.5;
const CURSOR_SIZE_BOOST = 0.4;

const OFFSCREEN_MOUSE = { x: -1000, y: -1000 };

interface Cluster {
  cx: number;
  cy: number;
  radius: number;
  count: number;
}

interface Particle {
  x: number;
  y: number;
  baseOpacity: number;
  phase: number;
}

interface AuroraDotsProps {
  /** `"R, G, B"` triplet (no alpha). Alpha is driven by `glowIntensity`. */
  particleColor?: string;
  particleSize?: number;
  glowIntensity?: number;
  hoverGlowIntensity?: number;
  animationSpeed?: number;
  hoverRadius?: number;
  interactive?: boolean;
  clusters?: Cluster[];
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_CLUSTERS: Cluster[] = [
  { cx: 20, cy: 15, radius: 8, count: 45 },
  { cx: 45, cy: 12, radius: 6, count: 35 },
  { cx: 70, cy: 18, radius: 10, count: 60 },
  { cx: 85, cy: 14, radius: 7, count: 40 },
  { cx: 15, cy: 35, radius: 9, count: 50 },
  { cx: 35, cy: 40, radius: 7, count: 42 },
  { cx: 55, cy: 38, radius: 8, count: 48 },
  { cx: 75, cy: 35, radius: 6, count: 38 },
  { cx: 88, cy: 40, radius: 7, count: 40 },
  { cx: 10, cy: 60, radius: 8, count: 45 },
  { cx: 30, cy: 58, radius: 9, count: 52 },
  { cx: 50, cy: 62, radius: 7, count: 42 },
  { cx: 68, cy: 60, radius: 10, count: 58 },
  { cx: 85, cy: 65, radius: 8, count: 46 },
  { cx: 18, cy: 82, radius: 7, count: 40 },
  { cx: 42, cy: 85, radius: 8, count: 48 },
  { cx: 65, cy: 80, radius: 9, count: 50 },
  { cx: 82, cy: 88, radius: 6, count: 35 },
];

/**
 * Expands each cluster definition into normalised `[0..1]` particle positions
 * scattered around the cluster center using polar coordinates plus a small
 * random angular offset to avoid visible radial symmetry.
 */
function buildParticles(clusters: Cluster[]): Particle[] {
  const particles: Particle[] = [];
  for (const cluster of clusters) {
    for (let i = 0; i < cluster.count; i++) {
      const angle = (i / cluster.count) * Math.PI * 2;
      const radius = Math.random() * cluster.radius;
      const angleJitter = (Math.random() - 0.5) * 0.5;
      particles.push({
        x: (cluster.cx + Math.cos(angle + angleJitter) * radius) / 100,
        y: (cluster.cy + Math.sin(angle + angleJitter) * radius) / 100,
        baseOpacity: BASE_OPACITY_MIN + Math.random() * BASE_OPACITY_JITTER,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
  return particles;
}

/**
 * Parses `"r, g, b"` into a numeric triplet. Invalid components fall back to
 * zero so a malformed prop can't throw inside the animation loop.
 */
function parseRgbTriplet(rgb: string): [number, number, number] {
  const [r, g, b] = rgb.split(",").map((part) => Number(part.trim()) || 0);
  return [r, g, b];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Canvas field of glowing cyan dots arranged in soft clusters. Reacts to the
 * cursor and also self-animates an orbiting "auto-hover" point so the effect
 * is alive even when idle. Pauses rendering while off-screen via
 * IntersectionObserver.
 */
export function AuroraDots({
  particleColor = DEFAULT_PARTICLE_RGB,
  particleSize = DEFAULT_PARTICLE_SIZE_PX,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  hoverGlowIntensity = DEFAULT_HOVER_GLOW_INTENSITY,
  animationSpeed = DEFAULT_ANIMATION_SPEED,
  hoverRadius = DEFAULT_HOVER_RADIUS_PCT,
  interactive = true,
  clusters = DEFAULT_CLUSTERS,
  className,
  children,
}: AuroraDotsProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const mouseRef = React.useRef({ ...OFFSCREEN_MOUSE });
  const animationRef = React.useRef<number | undefined>(undefined);
  const autoHoverRef = React.useRef({ x: 0.5, y: 0.5, angle: 0 });
  const isVisibleRef = React.useRef(true);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    particlesRef.current = buildParticles(clusters);
    const [r, g, b] = parseRgbTriplet(particleColor);
    const startedAt = Date.now();
    let lastFrameAt = Date.now();

    const renderFrame = () => {
      if (!isVisibleRef.current) {
        animationRef.current = undefined;
        return;
      }
      const now = Date.now();
      const elapsed = now - lastFrameAt;
      if (elapsed > FRAME_INTERVAL_MS) {
        lastFrameAt = now - (elapsed % FRAME_INTERVAL_MS);
        const totalSeconds = (now - startedAt) / 1000;

        autoHoverRef.current.angle += AUTO_HOVER_ANGULAR_STEP;
        autoHoverRef.current.x =
          0.5 + Math.cos(autoHoverRef.current.angle) * AUTO_HOVER_ORBIT_RADIUS;
        autoHoverRef.current.y =
          0.5 + Math.sin(autoHoverRef.current.angle) * AUTO_HOVER_ORBIT_RADIUS;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const hoverRadiusPx = (canvas.width * hoverRadius) / 100;

        for (const particle of particlesRef.current) {
          const px = particle.x * canvas.width;
          const py = particle.y * canvas.height;
          const wave = Math.sin(totalSeconds / animationSpeed + particle.phase);
          let opacity = particle.baseOpacity + wave * glowIntensity + glowIntensity;
          let size = particleSize;
          let blur = particleSize * PARTICLE_BLUR_MULTIPLIER;
          let glowAlpha = glowIntensity;

          const ahX = autoHoverRef.current.x * canvas.width;
          const ahY = autoHoverRef.current.y * canvas.height;
          const autoDistance = Math.hypot(px - ahX, py - ahY);
          const autoNorm = autoDistance / hoverRadiusPx;
          if (autoNorm < 1) {
            const falloff = 1 - autoNorm;
            opacity = Math.min(1, opacity + falloff * AUTO_HOVER_OPACITY_BOOST);
            size *= 1 + falloff * AUTO_HOVER_SIZE_BOOST;
            blur = size * HOVERED_BLUR_MULTIPLIER;
            glowAlpha = Math.min(1, glowAlpha + falloff * hoverGlowIntensity);
          }

          if (interactive) {
            const cursorDistance = Math.hypot(
              px - mouseRef.current.x,
              py - mouseRef.current.y,
            );
            const cursorNorm = cursorDistance / hoverRadiusPx;
            if (cursorNorm < 1) {
              const falloff = 1 - cursorNorm;
              opacity = Math.min(1, opacity + falloff * CURSOR_OPACITY_BOOST);
              size *= 1 + falloff * CURSOR_SIZE_BOOST;
              blur = size * HOVERED_BLUR_MULTIPLIER;
              glowAlpha = hoverGlowIntensity;
            }
          }

          ctx.save();
          ctx.shadowBlur = blur;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowAlpha})`;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`;
          ctx.beginPath();
          ctx.arc(px, py, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      animationRef.current = requestAnimationFrame(renderFrame);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !animationRef.current) renderFrame();
      },
      { threshold: 0 },
    );
    observer.observe(container);

    renderFrame();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      observer.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    clusters,
    particleColor,
    particleSize,
    glowIntensity,
    hoverGlowIntensity,
    animationSpeed,
    hoverRadius,
    interactive,
  ]);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { ...OFFSCREEN_MOUSE };
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}

export default AuroraDots;
