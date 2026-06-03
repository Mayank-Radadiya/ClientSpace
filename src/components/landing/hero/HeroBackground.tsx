import { RetroGrid } from "@/components/magicui/retro-grid";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0A]">
      {/* Layer 2: RetroGrid */}
      <RetroGrid
        className="z-[1] opacity-40"
        angle={65}
        cellSize={60}
        lightLineColor="rgba(99, 102, 241, 0.15)"
        darkLineColor="rgba(99, 102, 241, 0.08)"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)",
        }}
      />

      {/* Layer 3: Radial vignette glow */}
      <div 
        className="absolute inset-0 z-[2]"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)"
        }}
      />

      {/* Layer 4: Noise texture */}
      <svg className="pointer-events-none absolute inset-0 z-[3] h-full w-full opacity-[0.035]">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Layer 5: Horizontal line accent */}
      <div className="absolute left-0 right-0 top-1/2 z-[4] h-[1px] bg-[#1F1F1F]" />
    </div>
  );
}
