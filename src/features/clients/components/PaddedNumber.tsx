export function PaddedNumber({
  value,
  pad = 2,
}: {
  value: number;
  pad?: number;
}) {
  return <>{value.toString().padStart(pad, "0")}</>;
}
