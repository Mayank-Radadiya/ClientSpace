export function SectionMeta({
  code,
  sheet,
  total,
  location = "US-EAST-1",
}: {
  code: string;
  sheet: string;
  total: string;
  location?: string;
}) {
  return (
    <div className="mb-16 grid grid-cols-3 border-y border-[#1a1a1a] px-6 py-3">
      <span className="font-mono text-[10px] tracking-[0.15em] text-[#555] uppercase">
        § {code}
      </span>
      <span className="text-center font-mono text-[10px] tracking-[0.15em] text-[#555] uppercase">
        MRD-2026.01 · SHEET {sheet}/{total}
      </span>
      <span className="text-right font-mono text-[10px] tracking-[0.15em] text-[#555] uppercase">
        FILED FROM {location} · 03:14 UTC
      </span>
    </div>
  );
}
