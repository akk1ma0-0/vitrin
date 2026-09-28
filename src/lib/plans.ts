/**
 * Single source of truth for plan limits (spec section 6).
 * Every limit check happens server-side against this file; the UI only
 * reflects these values, it never re-implements the rules.
 */
export type Plan = "free" | "pro";

export interface PlanLimits {
  maxWorks: number;
  maxUploadTotalBytes: number;
  maxUploadFileBytes: number;
  allowedUploadKinds: Array<"image" | "video" | "pdf">;
  branding: boolean;
  fullAnalytics: boolean;
  catalogBoost: boolean;
  customAccentColor: boolean;
  linkRecheckIntervalDays: number;
  customDomain: boolean;
  pdfExport: boolean;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxWorks: 12,
    maxUploadTotalBytes: 100 * MB,
    maxUploadFileBytes: 10 * MB,
    allowedUploadKinds: ["image"],
    branding: true,
    fullAnalytics: false,
    catalogBoost: false,
    customAccentColor: false,
    linkRecheckIntervalDays: 7,
    customDomain: false,
    pdfExport: false,
  },
  pro: {
    maxWorks: 200,
    maxUploadTotalBytes: 5 * GB,
    maxUploadFileBytes: 500 * MB,
    allowedUploadKinds: ["image", "video", "pdf"],
    branding: false,
    fullAnalytics: true,
    catalogBoost: true,
    customAccentColor: true,
    linkRecheckIntervalDays: 1,
    customDomain: false, // stage 3
    pdfExport: false, // stage 3
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canAddWork(plan: Plan, currentWorksCount: number): boolean {
  return currentWorksCount < getPlanLimits(plan).maxWorks;
}

export function canUploadFile(
  plan: Plan,
  kind: "image" | "video" | "pdf",
  fileSizeBytes: number,
  currentTotalBytes: number,
): { ok: true } | { ok: false; reason: string } {
  const limits = getPlanLimits(plan);
  if (!limits.allowedUploadKinds.includes(kind)) {
    return { ok: false, reason: `plan_does_not_allow_${kind}` };
  }
  if (fileSizeBytes > limits.maxUploadFileBytes) {
    return { ok: false, reason: "file_too_large" };
  }
  if (currentTotalBytes + fileSizeBytes > limits.maxUploadTotalBytes) {
    return { ok: false, reason: "storage_quota_exceeded" };
  }
  return { ok: true };
}

/** Paddle subscription statuses that keep the account on the Pro plan (grace period included). */
export const PRO_ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

export function resolvePlanFromSubscription(
  status: string | null | undefined,
  currentPeriodEnd: string | null | undefined,
): Plan {
  if (!status) return "free";
  if (PRO_ACTIVE_STATUSES.has(status)) return "pro";
  if (status === "canceled" && currentPeriodEnd) {
    return new Date(currentPeriodEnd).getTime() > Date.now() ? "pro" : "free";
  }
  return "free";
}

export const PADDLE_PRICES = {
  monthly: { amountEur: 8, interval: "month" as const },
  yearly: { amountEur: 72, interval: "year" as const },
};
