import type { JobPost, User } from "./types";
import { acceptedBid, bidsForJob, milestone1Funded } from "./store";

// Blueprint 4.3 resource policies — enforced server-side in pages AND actions.
export function isJobCustomer(user: User, job: JobPost): boolean { return user.role === "CUSTOMER" && job.customerId === user.id; }
export function isJobPro(user: User, job: JobPost): boolean {
  return user.role === "PRO" && acceptedBid(job.id)?.proId === user.id;
}
export function hasBidOnJob(user: User, job: JobPost): boolean {
  return user.role === "PRO" && bidsForJob(job.id).some((b) => b.proId === user.id);
}
export function canViewJob(user: User, job: JobPost): boolean {
  if (user.role === "ADMIN") return true;
  if (isJobCustomer(user, job) || isJobPro(user, job) || hasBidOnJob(user, job)) return true;
  // Pros browsing leads may view OPEN jobs in the public (approximate) form only.
  return user.role === "PRO" && job.status === "OPEN";
}
export function canChat(user: User, job: JobPost): boolean {
  return isJobCustomer(user, job) || isJobPro(user, job) || hasBidOnJob(user, job);
}
// Exact address + real contact details: only the job's customer (their own home)
// and the ACCEPTED pro, and only once milestone 1 is funded (blueprint 4.3).
export function canSeeAddress(user: User, job: JobPost): boolean {
  if (isJobCustomer(user, job)) return true;
  return isJobPro(user, job) && milestone1Funded(job.id);
}
