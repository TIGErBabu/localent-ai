// Launch + platform config. Values come from env (see .env.example) with the
// blueprint v2 section 7 defaults adopted by the business on 2026-11-10.
function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export interface Category {
  slug: string;
  label: string;
  blurb: string;
  icon: string;
  launch: boolean;
}

export const config = {
  // DEMO MODE: true until a real DATABASE_URL (Supabase Postgres) is provisioned.
  demoMode: !process.env.DATABASE_URL,
  metro: "Gainesville, FL",
  proCommissionBps: intEnv("PLATFORM_PRO_COMMISSION_BPS", 1000), // 10%
  customerFeeBps: intEnv("PLATFORM_CUSTOMER_FEE_BPS", 500), // 5%
  autoReleaseHours: intEnv("AUTO_RELEASE_HOURS", 72),
  matchedProLimit: intEnv("MATCHED_PRO_LIMIT", 5),
  milestoneDepositPct: 30, // milestone 1 = 30% deposit/materials, milestone 2 = balance
  categories: [
    { slug: "plumbing", label: "Plumbing", blurb: "Leaks, water heaters, drains, repipes and emergency repairs.", icon: "🔧", launch: true },
    { slug: "electrical", label: "Electrical", blurb: "Panels, ceiling fans, lighting, EV chargers and safety fixes.", icon: "⚡", launch: true },
    { slug: "handyman", label: "Handyman", blurb: "Drywall, decks, doors, mounting and the whole odd-job list.", icon: "🛠️", launch: true },
    { slug: "carpentry", label: "Carpentry", blurb: "Custom shelving, trim, framing and repairs.", icon: "🪚", launch: false },
    { slug: "gardening", label: "Gardening", blurb: "Yard cleanup, irrigation and landscaping help.", icon: "🌿", launch: false },
    { slug: "cleaning", label: "Cleaning", blurb: "Deep cleans, move-out cleans and recurring service.", icon: "🧹", launch: false },
  ] as Category[],
};

export function categoryLabel(slug: string): string {
  return config.categories.find((c) => c.slug === slug)?.label ?? slug;
}
export function categoryBySlug(slug: string): Category | undefined {
  return config.categories.find((c) => c.slug === slug);
}
