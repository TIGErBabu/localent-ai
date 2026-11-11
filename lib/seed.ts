import type { StoreData } from "./types";

// ALL seed data is fictional. Demo passwords are the literal word "demo"
// (stored as a demo-only marker in passwordHash) and are shown on the login page.
const T = "2026-11-08T14:00:00.000Z";

export function buildSeed(): StoreData {
  return {
    users: [
      { id: "u-admin", email: "admin@localent.demo", passwordHash: "demo", role: "ADMIN", name: "Ava Park (Admin)", phoneNumber: "+13525550100", phoneVerified: true, createdAt: T },
      { id: "u-cust-maya", email: "maya@localent.demo", passwordHash: "demo", role: "CUSTOMER", name: "Maya Chen", phoneNumber: "+13525550111", phoneVerified: true, createdAt: T },
      { id: "u-cust-jordan", email: "jordan@localent.demo", passwordHash: "demo", role: "CUSTOMER", name: "Jordan Alvarez", phoneNumber: "+13525550112", phoneVerified: true, createdAt: T },
      { id: "u-cust-priya", email: "priya@localent.demo", passwordHash: "demo", role: "CUSTOMER", name: "Priya Nair", phoneNumber: "+13525550113", phoneVerified: false, createdAt: T },
      { id: "u-pro-flowright", email: "flowright@localent.demo", passwordHash: "demo", role: "PRO", name: "Marcus Reed", phoneNumber: "+13525550201", phoneVerified: true, createdAt: T },
      { id: "u-pro-sparksafe", email: "sparksafe@localent.demo", passwordHash: "demo", role: "PRO", name: "Dana Whitfield", phoneNumber: "+13525550202", phoneVerified: true, createdAt: T },
      { id: "u-pro-handyworks", email: "handyworks@localent.demo", passwordHash: "demo", role: "PRO", name: "Sam Okafor", phoneNumber: "+13525550203", phoneVerified: true, createdAt: T },
      { id: "u-pro-pipepros", email: "pipepros@localent.demo", passwordHash: "demo", role: "PRO", name: "Luis Delgado", phoneNumber: "+13525550204", phoneVerified: true, createdAt: T },
      { id: "u-pro-fixit", email: "fixit@localent.demo", passwordHash: "demo", role: "PRO", name: "Erin Walsh", phoneNumber: "+13525550205", phoneVerified: true, createdAt: T },
      { id: "u-pro-brightspark", email: "brightspark@localent.demo", passwordHash: "demo", role: "PRO", name: "Tom Becker", phoneNumber: "+13525550206", phoneVerified: false, createdAt: T },
    ],
    companyProfiles: [
      { id: "cp-flowright", userId: "u-pro-flowright", businessName: "FlowRight Plumbing LLC", slug: "flowright-plumbing", skillsArray: ["plumbing"], bio: "Family-run plumbing crew serving Gainesville for over a decade. Upfront flat pricing, shoe covers on, and we leave the cabinet drier than we found it.", portfolioUrls: ["demo://portfolio/flowright-1", "demo://portfolio/flowright-2", "demo://portfolio/flowright-3"], isVerified: true, verificationTier: "VERIFIED_PRO", backgroundCheckStatus: "PASSED", licenceNumber: "FL-CFC-1428901", licenceTrade: "Plumbing", licenceState: "FL", serviceRadiusMiles: 30, locationLat: 29.653, locationLng: -82.331, locationLabel: "Downtown Gainesville", responseTimeHours: 2, yearsInBusiness: 11, createdAt: T },
      { id: "cp-sparksafe", userId: "u-pro-sparksafe", businessName: "SparkSafe Electrical", slug: "sparksafe-electrical", skillsArray: ["electrical"], bio: "Licensed electricians for panels, fans, lighting and EV chargers. Permits pulled when required, every job tested and labeled before we leave.", portfolioUrls: ["demo://portfolio/sparksafe-1", "demo://portfolio/sparksafe-2"], isVerified: true, verificationTier: "VERIFIED_PRO", backgroundCheckStatus: "PASSED", licenceNumber: "FL-EC-13007812", licenceTrade: "Electrical", licenceState: "FL", serviceRadiusMiles: 25, locationLat: 29.642, locationLng: -82.312, locationLabel: "Midtown Gainesville", responseTimeHours: 3, yearsInBusiness: 8, createdAt: T },
      { id: "cp-handyworks", userId: "u-pro-handyworks", businessName: "HandyWorks Co.", slug: "handyworks-co", skillsArray: ["handyman"], bio: "One call for the whole odd-job list: drywall, doors, mounting, minor carpentry and repairs done right the first time.", portfolioUrls: ["demo://portfolio/handyworks-1", "demo://portfolio/handyworks-2"], isVerified: false, verificationTier: "BASIC_ID", backgroundCheckStatus: null, licenceNumber: null, licenceTrade: null, licenceState: null, serviceRadiusMiles: 20, locationLat: 29.661, locationLng: -82.342, locationLabel: "Northwest Gainesville", responseTimeHours: 5, yearsInBusiness: 4, createdAt: T },
      { id: "cp-pipepros", userId: "u-pro-pipepros", businessName: "Gainesville Pipe Pros", slug: "gainesville-pipe-pros", skillsArray: ["plumbing"], bio: "Fast-response plumbing for leaks and water heaters. Same-day slots most weeks, honest assessments before any work starts.", portfolioUrls: ["demo://portfolio/pipepros-1"], isVerified: false, verificationTier: "BASIC_ID", backgroundCheckStatus: null, licenceNumber: null, licenceTrade: null, licenceState: null, serviceRadiusMiles: 25, locationLat: 29.635, locationLng: -82.361, locationLabel: "Southwest Gainesville", responseTimeHours: 4, yearsInBusiness: 6, createdAt: T },
      { id: "cp-fixit", userId: "u-pro-fixit", businessName: "FixIt Fast Handyman", slug: "fixit-fast-handyman", skillsArray: ["handyman"], bio: "Background-checked handyman team for repairs big and small. Photo updates as we work, tidy finish guaranteed.", portfolioUrls: ["demo://portfolio/fixit-1", "demo://portfolio/fixit-2", "demo://portfolio/fixit-3"], isVerified: true, verificationTier: "VERIFIED_PRO", backgroundCheckStatus: "PASSED", licenceNumber: "FL-HM-22140", licenceTrade: "Handyman", licenceState: "FL", serviceRadiusMiles: 35, locationLat: 29.672, locationLng: -82.301, locationLabel: "East Gainesville", responseTimeHours: 1, yearsInBusiness: 9, createdAt: T },
      { id: "cp-brightspark", userId: "u-pro-brightspark", businessName: "BrightSpark Home Services", slug: "brightspark-home-services", skillsArray: ["electrical", "handyman"], bio: "New to Localent — electrical and handyman services across the Gainesville metro. Verification in progress.", portfolioUrls: ["demo://portfolio/brightspark-1"], isVerified: false, verificationTier: "NONE", backgroundCheckStatus: "IN_REVIEW", licenceNumber: "FL-EC-13009931", licenceTrade: "Electrical", licenceState: "FL", serviceRadiusMiles: 20, locationLat: 29.621, locationLng: -82.295, locationLabel: "South Gainesville", responseTimeHours: 6, yearsInBusiness: 2, createdAt: T },
    ],
    jobPosts: [
      { id: "job-leak", customerId: "u-cust-maya", title: "Kitchen sink leak soaking the cabinet", category: "plumbing", description: "Steady drip from the P-trap under the kitchen sink. Cabinet floor is damp and starting to smell musty. Shut-off valve works. Need it found and fixed properly, not just tightened.", budgetMinCents: 15000, budgetMaxCents: 30000, locationLat: 29.65, locationLng: -82.33, locationLabel: "Downtown Gainesville (approx.)", status: "OPEN", preferredDate: "2026-11-13", matchedProLimit: 5, completionCode: null, completionRequestedAt: null, createdAt: "2026-11-09T15:20:00.000Z" },
      { id: "job-panel", customerId: "u-cust-jordan", title: "Breaker panel upgrade to 200A", category: "electrical", description: "Old 100A panel trips when the AC and oven run together. Upgrade to 200A service, labeled breakers, permit coordination included in quote please.", budgetMinCents: 60000, budgetMaxCents: 90000, locationLat: 29.64, locationLng: -82.32, locationLabel: "Midtown Gainesville (approx.)", status: "IN_PROGRESS", preferredDate: "2026-11-12", matchedProLimit: 5, completionCode: "739204", completionRequestedAt: null, createdAt: "2026-11-05T10:00:00.000Z" },
      { id: "job-drywall", customerId: "u-cust-priya", title: "Drywall patch and paint after a door-knob hole", category: "handyman", description: "Bedroom door knob punched a hole in the drywall. Patch, texture-match and paint the section. Paint provided.", budgetMinCents: 20000, budgetMaxCents: 40000, locationLat: 29.67, locationLng: -82.31, locationLabel: "East Gainesville (approx.)", status: "COMPLETED", preferredDate: "2026-11-02", matchedProLimit: 5, completionCode: "512880", completionRequestedAt: "2026-11-03T16:00:00.000Z", createdAt: "2026-10-30T09:12:00.000Z" },
      { id: "job-waterheater", customerId: "u-cust-maya", title: "Water heater replacement — still leaking", category: "plumbing", description: "40-gallon gas water heater replaced last week, but a slow drip continues at the base and the floor stays wet. Need this resolved under the original job.", budgetMinCents: 80000, budgetMaxCents: 110000, locationLat: 29.65, locationLng: -82.33, locationLabel: "Downtown Gainesville (approx.)", status: "DISPUTED", preferredDate: "2026-11-06", matchedProLimit: 5, completionCode: "905317", completionRequestedAt: null, createdAt: "2026-11-01T11:40:00.000Z" },
      { id: "job-fan", customerId: "u-cust-jordan", title: "Ceiling fan and dimmer install in living room", category: "electrical", description: "Replace an old ceiling fan with a new fan/light combo (already purchased) and swap the wall switch for a dimmer. 9-ft ceiling, existing wiring.", budgetMinCents: 12000, budgetMaxCents: 25000, locationLat: 29.64, locationLng: -82.32, locationLabel: "Midtown Gainesville (approx.)", status: "OPEN", preferredDate: "2026-11-15", matchedProLimit: 5, completionCode: null, completionRequestedAt: null, createdAt: "2026-11-10T08:30:00.000Z" },
      { id: "job-deck", customerId: "u-cust-priya", title: "Replace six rotten deck boards", category: "handyman", description: "Six pressure-treated deck boards are soft and need replacing, plus a loose railing section tightened. Deck is ground-level, easy access from the yard.", budgetMinCents: 30000, budgetMaxCents: 55000, locationLat: 29.67, locationLng: -82.31, locationLabel: "East Gainesville (approx.)", status: "OPEN", preferredDate: "2026-11-16", matchedProLimit: 5, completionCode: null, completionRequestedAt: null, createdAt: "2026-11-10T09:45:00.000Z" },
      { id: "job-tv", customerId: "u-cust-maya", title: "Mount 65-inch TV and hide the cables", category: "handyman", description: "Mount a 65-inch TV on a living-room stud wall, fit a tilt bracket (provided) and run cables in-wall so nothing dangles.", budgetMinCents: 12000, budgetMaxCents: 22000, locationLat: 29.65, locationLng: -82.33, locationLabel: "Downtown Gainesville (approx.)", status: "SCHEDULED", preferredDate: "2026-11-14", matchedProLimit: 5, completionCode: null, completionRequestedAt: null, createdAt: "2026-11-08T13:05:00.000Z" },
    ],
    jobPrivateDetails: [
      { jobId: "job-leak", streetAddress: "418 NW 8th Ave", unit: null, zip: "32601", accessNotes: "Side gate unlocked; dog is friendly." },
      { jobId: "job-panel", streetAddress: "1022 NE 12th St", unit: null, zip: "32601", accessNotes: "Panel is in the garage, right wall." },
      { jobId: "job-drywall", streetAddress: "77 SE 41st Ter", unit: "Unit B", zip: "32641", accessNotes: null },
      { jobId: "job-waterheater", streetAddress: "418 NW 8th Ave", unit: null, zip: "32601", accessNotes: "Heater is in the laundry closet." },
      { jobId: "job-fan", streetAddress: "1022 NE 12th St", unit: null, zip: "32601", accessNotes: null },
      { jobId: "job-deck", streetAddress: "77 SE 41st Ter", unit: "Unit B", zip: "32641", accessNotes: "Boards stacked by the shed." },
      { jobId: "job-tv", streetAddress: "418 NW 8th Ave", unit: null, zip: "32601", accessNotes: null },
    ],
    appointments: [
      { id: "appt-panel", jobId: "job-panel", proId: "u-pro-sparksafe", scheduledDate: "2026-11-12", windowStart: "08:00", windowEnd: "11:00", status: "CONFIRMED", createdAt: "2026-11-06T09:00:00.000Z" },
      { id: "appt-tv", jobId: "job-tv", proId: "u-pro-handyworks", scheduledDate: "2026-11-14", windowStart: "13:00", windowEnd: "16:00", status: "PROPOSED", createdAt: "2026-11-09T10:15:00.000Z" },
      { id: "appt-drywall", jobId: "job-drywall", proId: "u-pro-fixit", scheduledDate: "2026-11-02", windowStart: "09:00", windowEnd: "12:00", status: "DONE", createdAt: "2026-10-31T09:00:00.000Z" },
    ],
    proAvailability: [
      ...["u-pro-flowright", "u-pro-sparksafe", "u-pro-handyworks", "u-pro-pipepros", "u-pro-fixit", "u-pro-brightspark"].flatMap((proId) =>
        [1, 2, 3, 4, 5].map((weekday) => ({ id: `av-${proId}-${weekday}`, proId, weekday, startTime: "08:00", endTime: "17:00" }))
      ),
      { id: "av-flowright-sat", proId: "u-pro-flowright", weekday: 6, startTime: "09:00", endTime: "13:00" },
    ],
    bids: [
      { id: "bid-leak-flowright", jobId: "job-leak", proId: "u-pro-flowright", totalAmountCents: 24000, proCommissionRateBps: 1000, proCommissionCents: 2400, customerFeeRateBps: 500, customerFeeCents: 1200, netPayoutCents: 21600, proposalText: "We will replace the P-trap and supply lines, reseal the basket strainer and test under pressure. Flat price, parts included, 12-month workmanship warranty.", status: "PENDING", expiresAt: "2026-11-13T15:20:00.000Z", createdAt: "2026-11-09T17:02:00.000Z" },
      { id: "bid-leak-pipepros", jobId: "job-leak", proId: "u-pro-pipepros", totalAmountCents: 21500, proCommissionRateBps: 1000, proCommissionCents: 2150, customerFeeRateBps: 500, customerFeeCents: 1075, netPayoutCents: 19350, proposalText: "Same-day slot available. Full trap assembly replacement and a cabinet dry-out check. 6-month warranty on parts and labor.", status: "PENDING", expiresAt: "2026-11-13T19:40:00.000Z", createdAt: "2026-11-09T19:40:00.000Z" },
      { id: "bid-panel-sparksafe", jobId: "job-panel", proId: "u-pro-sparksafe", totalAmountCents: 68000, proCommissionRateBps: 1000, proCommissionCents: 6800, customerFeeRateBps: 500, customerFeeCents: 3400, netPayoutCents: 61200, proposalText: "200A panel swap with permit, utility coordination and labeled breakers. One full day on site.", status: "ACCEPTED", expiresAt: "2026-11-08T10:00:00.000Z", createdAt: "2026-11-05T12:30:00.000Z" },
      { id: "bid-drywall-fixit", jobId: "job-drywall", proId: "u-pro-fixit", totalAmountCents: 32000, proCommissionRateBps: 1000, proCommissionCents: 3200, customerFeeRateBps: 500, customerFeeCents: 1600, netPayoutCents: 28800, proposalText: "Patch, texture-match and two coats of your paint. Done in one visit.", status: "ACCEPTED", expiresAt: "2026-11-01T09:00:00.000Z", createdAt: "2026-10-30T11:00:00.000Z" },
      { id: "bid-heater-flowright", jobId: "job-waterheater", proId: "u-pro-flowright", totalAmountCents: 95000, proCommissionRateBps: 1000, proCommissionCents: 9500, customerFeeRateBps: 500, customerFeeCents: 4750, netPayoutCents: 85500, proposalText: "Remove and replace the 40-gal gas heater, new expansion tank and drip pan, haul-away included.", status: "ACCEPTED", expiresAt: "2026-11-03T10:00:00.000Z", createdAt: "2026-11-01T13:15:00.000Z" },
      { id: "bid-deck-handyworks", jobId: "job-deck", proId: "u-pro-handyworks", totalAmountCents: 45000, proCommissionRateBps: 1000, proCommissionCents: 4500, customerFeeRateBps: 500, customerFeeCents: 2250, netPayoutCents: 40500, proposalText: "Six boards replaced with matching pressure-treated lumber, railing re-secured, all screws stainless. Half-day job.", status: "PENDING", expiresAt: "2026-11-14T09:45:00.000Z", createdAt: "2026-11-10T11:20:00.000Z" },
      { id: "bid-tv-handyworks", jobId: "job-tv", proId: "u-pro-handyworks", totalAmountCents: 18500, proCommissionRateBps: 1000, proCommissionCents: 1850, customerFeeRateBps: 500, customerFeeCents: 925, netPayoutCents: 16650, proposalText: "Stud-mounted tilt bracket, in-wall cable kit, level-checked and dust-sheeted. About 90 minutes.", status: "ACCEPTED", expiresAt: "2026-11-10T13:05:00.000Z", createdAt: "2026-11-08T15:44:00.000Z" },
    ],
    chatMessages: [
      { id: "msg-1", jobId: "job-leak", senderId: "u-cust-maya", messageText: "Hi! The drip is about a bowl of water a day. Is this something you can usually fix in one visit?", flagged: false, timestamp: "2026-11-09T16:05:00.000Z" },
      { id: "msg-2", jobId: "job-leak", senderId: "u-pro-flowright", messageText: "Almost always, yes. If the trap itself is cracked we replace the whole assembly — my bid covers that either way.", flagged: false, timestamp: "2026-11-09T17:05:00.000Z" },
      { id: "msg-3", jobId: "job-panel", senderId: "u-cust-jordan", messageText: "My number is [phone hidden until escrow is funded] if you need to reach me on the day.", flagged: true, timestamp: "2026-11-05T13:10:00.000Z" },
      { id: "msg-4", jobId: "job-panel", senderId: "u-pro-sparksafe", messageText: "Deposit received on my side — see you in the 8–11 window. I will check in through the app when I arrive.", flagged: false, timestamp: "2026-11-07T09:22:00.000Z" },
      { id: "msg-5", jobId: "job-waterheater", senderId: "u-cust-maya", messageText: "There is still water at the base this morning. I have opened a dispute so the remaining payment stays held until we sort this out.", flagged: false, timestamp: "2026-11-09T08:12:00.000Z" },
      { id: "msg-6", jobId: "job-waterheater", senderId: "u-pro-flowright", messageText: "Understood — I want to come back and inspect it. The drip may be condensation on the new tank, but I will confirm on site.", flagged: false, timestamp: "2026-11-09T09:03:00.000Z" },
    ],
    reviews: [
      { id: "rev-1", jobId: "job-drywall", customerId: "u-cust-priya", proId: "u-pro-fixit", ratingValue: 5, reviewText: "Erin's patch is invisible — texture match is perfect and the room was left cleaner than before. Worth every cent.", createdAt: "2026-11-04T10:30:00.000Z" },
      { id: "rev-2", jobId: "job-panel", customerId: "u-cust-jordan", proId: "u-pro-flowright", ratingValue: 5, reviewText: "Fixed a slow drain during a kitchen job last spring. On time, explained everything, zero surprises on price.", createdAt: "2026-05-18T10:30:00.000Z" },
    ],
    paymentMilestones: [
      { id: "ms-panel-1", jobId: "job-panel", bidId: "bid-panel-sparksafe", seq: 1, label: "Deposit & materials", amountCents: 20400, status: "HELD", paymentIntentId: "pi_demo_panel_1", transferId: null, createdAt: "2026-11-06T09:05:00.000Z" },
      { id: "ms-panel-2", jobId: "job-panel", bidId: "bid-panel-sparksafe", seq: 2, label: "Balance on completion", amountCents: 47600, status: "UNFUNDED", paymentIntentId: null, transferId: null, createdAt: "2026-11-06T09:05:00.000Z" },
      { id: "ms-drywall-1", jobId: "job-drywall", bidId: "bid-drywall-fixit", seq: 1, label: "Deposit & materials", amountCents: 9600, status: "RELEASED", paymentIntentId: "pi_demo_drywall_1", transferId: "tr_demo_drywall_1", createdAt: "2026-10-31T09:05:00.000Z" },
      { id: "ms-drywall-2", jobId: "job-drywall", bidId: "bid-drywall-fixit", seq: 2, label: "Balance on completion", amountCents: 22400, status: "RELEASED", paymentIntentId: "pi_demo_drywall_2", transferId: "tr_demo_drywall_2", createdAt: "2026-10-31T09:05:00.000Z" },
      { id: "ms-heater-1", jobId: "job-waterheater", bidId: "bid-heater-flowright", seq: 1, label: "Deposit & materials", amountCents: 28500, status: "HELD", paymentIntentId: "pi_demo_heater_1", transferId: null, createdAt: "2026-11-02T09:05:00.000Z" },
      { id: "ms-heater-2", jobId: "job-waterheater", bidId: "bid-heater-flowright", seq: 2, label: "Balance on completion", amountCents: 66500, status: "UNFUNDED", paymentIntentId: null, transferId: null, createdAt: "2026-11-02T09:05:00.000Z" },
      { id: "ms-tv-1", jobId: "job-tv", bidId: "bid-tv-handyworks", seq: 1, label: "Deposit & materials", amountCents: 5550, status: "UNFUNDED", paymentIntentId: null, transferId: null, createdAt: "2026-11-09T10:15:00.000Z" },
      { id: "ms-tv-2", jobId: "job-tv", bidId: "bid-tv-handyworks", seq: 2, label: "Balance on completion", amountCents: 12950, status: "UNFUNDED", paymentIntentId: null, transferId: null, createdAt: "2026-11-09T10:15:00.000Z" },
    ],
    changeOrders: [
      { id: "co-panel-1", jobId: "job-panel", proId: "u-pro-sparksafe", description: "Add a whole-home surge protector at the new panel while it is open.", deltaAmountCents: 8500, status: "PROPOSED", approvedAt: null, createdAt: "2026-11-10T07:50:00.000Z" },
    ],
    jobEvidence: [
      { id: "ev-panel-checkin", jobId: "job-panel", uploadedBy: "u-pro-sparksafe", kind: "CHECKIN", storageKey: "demo://evidence/job-panel/checkin", createdAt: "2026-11-10T08:02:00.000Z" },
      { id: "ev-panel-before", jobId: "job-panel", uploadedBy: "u-pro-sparksafe", kind: "BEFORE_PHOTO", storageKey: "demo://evidence/job-panel/before-1", createdAt: "2026-11-10T08:05:00.000Z" },
      { id: "ev-drywall-before", jobId: "job-drywall", uploadedBy: "u-pro-fixit", kind: "BEFORE_PHOTO", storageKey: "demo://evidence/job-drywall/before-1", createdAt: "2026-11-02T09:10:00.000Z" },
      { id: "ev-drywall-after", jobId: "job-drywall", uploadedBy: "u-pro-fixit", kind: "AFTER_PHOTO", storageKey: "demo://evidence/job-drywall/after-1", createdAt: "2026-11-02T15:40:00.000Z" },
    ],
    payments: [
      { id: "pay-panel-1", jobId: "job-panel", milestoneId: "ms-panel-1", paymentIntentId: "pi_demo_panel_1", transferId: null, grossCents: 21420, customerFeeCents: 1020, commissionCents: 2040, netCents: 18360, status: "HELD", createdAt: "2026-11-06T09:05:00.000Z" },
      { id: "pay-drywall-1", jobId: "job-drywall", milestoneId: "ms-drywall-1", paymentIntentId: "pi_demo_drywall_1", transferId: "tr_demo_drywall_1", grossCents: 10080, customerFeeCents: 480, commissionCents: 960, netCents: 8640, status: "RELEASED", createdAt: "2026-10-31T09:05:00.000Z" },
      { id: "pay-drywall-2", jobId: "job-drywall", milestoneId: "ms-drywall-2", paymentIntentId: "pi_demo_drywall_2", transferId: "tr_demo_drywall_2", grossCents: 23520, customerFeeCents: 1120, commissionCents: 2240, netCents: 20160, status: "RELEASED", createdAt: "2026-11-03T16:05:00.000Z" },
      { id: "pay-heater-1", jobId: "job-waterheater", milestoneId: "ms-heater-1", paymentIntentId: "pi_demo_heater_1", transferId: null, grossCents: 29925, customerFeeCents: 1425, commissionCents: 2850, netCents: 25650, status: "HELD", createdAt: "2026-11-02T09:05:00.000Z" },
    ],
    proPayoutAccounts: [
      { id: "po-flowright", userId: "u-pro-flowright", stripeAccountId: "acct_demo_flowright", onboardingStatus: "COMPLETE", kycStatus: "VERIFIED", payoutsEnabled: true, createdAt: T },
      { id: "po-sparksafe", userId: "u-pro-sparksafe", stripeAccountId: "acct_demo_sparksafe", onboardingStatus: "COMPLETE", kycStatus: "VERIFIED", payoutsEnabled: true, createdAt: T },
      { id: "po-fixit", userId: "u-pro-fixit", stripeAccountId: "acct_demo_fixit", onboardingStatus: "COMPLETE", kycStatus: "VERIFIED", payoutsEnabled: true, createdAt: T },
      { id: "po-handyworks", userId: "u-pro-handyworks", stripeAccountId: "acct_demo_handyworks", onboardingStatus: "PENDING", kycStatus: "PENDING", payoutsEnabled: false, createdAt: T },
      { id: "po-pipepros", userId: "u-pro-pipepros", stripeAccountId: "acct_demo_pipepros", onboardingStatus: "PENDING", kycStatus: "PENDING", payoutsEnabled: false, createdAt: T },
      { id: "po-brightspark", userId: "u-pro-brightspark", stripeAccountId: "acct_demo_brightspark", onboardingStatus: "NOT_STARTED", kycStatus: "NOT_STARTED", payoutsEnabled: false, createdAt: T },
    ],
    disputes: [
      { id: "disp-heater", jobId: "job-waterheater", openedBy: "u-cust-maya", reason: "Water heater replaced but a slow drip continues at the base; floor still wet. Customer asks for a return visit before the balance is released.", status: "OPEN", resolution: null, createdAt: "2026-11-09T08:10:00.000Z", resolvedAt: null },
    ],
    reports: [
      { id: "rep-1", reporterId: "u-cust-jordan", targetType: "MESSAGE", targetId: "msg-3", reason: "I shared my phone number before I understood the masking rule — please confirm it was hidden.", status: "OPEN", createdAt: "2026-11-06T08:00:00.000Z" },
    ],
    notifications: [
      { id: "ntf-1", userId: "u-pro-flowright", kind: "NEW_LEAD", text: "New plumbing lead near Downtown Gainesville: Kitchen sink leak soaking the cabinet.", jobId: "job-leak", read: false, smsSent: false, createdAt: "2026-11-09T15:21:00.000Z" },
      { id: "ntf-2", userId: "u-pro-pipepros", kind: "NEW_LEAD", text: "New plumbing lead near Downtown Gainesville: Kitchen sink leak soaking the cabinet.", jobId: "job-leak", read: false, smsSent: false, createdAt: "2026-11-09T15:21:00.000Z" },
      { id: "ntf-3", userId: "u-cust-maya", kind: "NEW_BID", text: "FlowRight Plumbing LLC bid $240 on your kitchen sink leak job.", jobId: "job-leak", read: false, smsSent: false, createdAt: "2026-11-09T17:02:00.000Z" },
      { id: "ntf-4", userId: "u-cust-maya", kind: "NEW_BID", text: "Gainesville Pipe Pros bid $215 on your kitchen sink leak job.", jobId: "job-leak", read: false, smsSent: false, createdAt: "2026-11-09T19:40:00.000Z" },
      { id: "ntf-5", userId: "u-pro-sparksafe", kind: "APPOINTMENT", text: "Panel upgrade appointment confirmed for Nov 12, 08:00–11:00.", jobId: "job-panel", read: true, smsSent: false, createdAt: "2026-11-06T09:00:00.000Z" },
    ],
    refreshTokens: [],
    adminAuditLogs: [
      { id: "audit-1", adminId: "u-admin", action: "VERIFY_PRO", targetType: "COMPANY_PROFILE", targetId: "cp-flowright", detail: "Tier set to VERIFIED_PRO after licence + background check review.", createdAt: "2026-10-20T10:00:00.000Z" },
    ],
  };
}
