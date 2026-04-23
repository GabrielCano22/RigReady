// Monogram "RR" inside a cyan outlined square + "RigReady" wordmark in Space Mono.
// Matches the wireframe/hi-fi: `[RR] RigReady` chip.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <span
        aria-hidden="true"
        className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-primary/80 bg-primary/5 font-mono text-[11px] font-bold text-primary"
      >
        RR
      </span>
      <span className="font-mono text-[13px] font-bold tracking-tight text-foreground">
        RigReady
      </span>
    </span>
  );
}
