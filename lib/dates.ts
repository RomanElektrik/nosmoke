// Single source of truth for "what calendar day is this" — uses LOCAL time,
// not UTC. Critical: mixing local-midnight-to-UTC with now-to-UTC
// produces off-by-one dates outside the UTC timezone (e.g. Russia, UTC+3
// evenings shift the UTC date forward, mornings shift back).

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
