/**
 * Specialization and work-category keys (spec section 5.9).
 * Values are i18n message keys under `specializations.*` / `categories.*`,
 * never hardcoded display text.
 */
export const SPECIALIZATIONS = [
  "web-developer",
  "frontend-developer",
  "backend-developer",
  "fullstack-developer",
  "mobile-developer",
  "game-developer",
  "qa-engineer",
  "devops",
  "data-analyst",
  "ui-ux-designer",
  "web-designer",
  "graphic-designer",
  "brand-designer",
  "3d-artist",
  "illustrator",
  "video-editor",
  "motion-designer",
  "photographer",
  "copywriter",
  "content-writer",
  "translator",
  "smm-manager",
  "performance-marketer",
  "seo-specialist",
  "other",
] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];

export function isValidSpecialization(value: string): value is Specialization {
  return (SPECIALIZATIONS as readonly string[]).includes(value);
}

export const WORK_CATEGORIES = [
  "website",
  "web-app",
  "mobile-app",
  "landing",
  "design-mockup",
  "prototype",
  "branding",
  "illustration",
  "video",
  "motion",
  "photo",
  "article",
  "social-post",
  "code-repository",
  "presentation",
  "other",
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export function isValidWorkCategory(value: string): value is WorkCategory {
  return (WORK_CATEGORIES as readonly string[]).includes(value);
}
