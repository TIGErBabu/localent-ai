export function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 });
}
export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
export function nowIso(): string { return new Date().toISOString(); }
export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? iso + "T12:00:00" : iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1); const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// Blueprint 4.1: bounding-box pre-filter, then haversine ranking (no PostGIS in v1).
export function inBoundingBox(lat: number, lng: number, cLat: number, cLng: number, radiusMiles: number): boolean {
  const latDelta = radiusMiles / 69.0;
  const lngDelta = radiusMiles / (69.0 * Math.cos((cLat * Math.PI) / 180));
  return Math.abs(lat - cLat) <= latDelta && Math.abs(lng - cLng) <= lngDelta;
}
export interface Split { proCommissionCents: number; customerFeeCents: number; netPayoutCents: number; customerTotalCents: number; }
// Server-side ONLY split computation (blueprint: client-submitted splits are ignored).
export function computeSplit(totalAmountCents: number, proBps: number, feeBps: number): Split {
  const proCommissionCents = Math.round((totalAmountCents * proBps) / 10000);
  const customerFeeCents = Math.round((totalAmountCents * feeBps) / 10000);
  return {
    proCommissionCents,
    customerFeeCents,
    netPayoutCents: totalAmountCents - proCommissionCents,
    customerTotalCents: totalAmountCents + customerFeeCents,
  };
}
const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Blueprint 4.3 anti-leakage: mask phone/email patterns in chat before escrow is funded.
export function maskContacts(text: string): { text: string; flagged: boolean } {
  let flagged = false;
  const masked = text.replace(PHONE_RE, () => { flagged = true; return "[phone hidden until escrow is funded]"; })
    .replace(EMAIL_RE, () => { flagged = true; return "[email hidden until escrow is funded]"; });
  return { text: masked, flagged };
}
export function roundCoord(n: number): number { return Math.round(n * 100) / 100; } // ~0.5mi public rounding
export function slugify(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
