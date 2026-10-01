import { z } from "zod";

import { SPECIALIZATIONS, WORK_CATEGORIES } from "@/lib/specializations";
import { validateUsernameFormat } from "@/lib/reserved-usernames";

export const usernameSchema = z
  .string()
  .toLowerCase()
  .superRefine((value, ctx) => {
    const result = validateUsernameFormat(value);
    if (!result.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
    }
  });

export const contactsSchema = z
  .object({
    telegram: z.string().max(100).optional(),
    whatsapp: z.string().max(30).optional(),
    email: z.string().email().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    behance: z.string().url().optional(),
    dribbble: z.string().url().optional(),
    instagram: z.string().max(100).optional(),
    x: z.string().max(100).optional(),
    website: z.string().url().optional(),
  })
  .refine((c) => Object.values(c).some((v) => v && v.length > 0), {
    message: "at_least_one_contact_required",
  });

export const profileOnboardingSchema = z.object({
  username: usernameSchema,
  displayName: z.string().min(1).max(60),
  specialization: z.enum(SPECIALIZATIONS),
  headline: z.string().max(80).optional(),
});

export const bulkLinksSchema = z.object({
  links: z
    .array(z.string().min(1))
    .min(1, "at_least_one_link_required")
    .max(10, "max_10_links"),
});

export const workUploadSchema = z.object({
  kind: z.enum(["image", "video", "pdf"]),
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(500),
        mime: z.string().min(1).max(100),
        sizeBytes: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(10),
});

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().min(1).max(60),
  headline: z.string().max(80).optional().nullable(),
  bio: z.string().max(600).optional().nullable(),
  specialization: z.enum(SPECIALIZATIONS),
  skills: z.array(z.string().min(1).max(30)).max(20),
  workLanguages: z.array(z.string().min(2).max(10)).max(10),
  country: z.string().length(2).optional().nullable(),
  rateMin: z.number().int().nonnegative().optional().nullable(),
  rateMax: z.number().int().nonnegative().optional().nullable(),
  rateCurrency: z.string().length(3).default("USD"),
  rateUnit: z.enum(["hour", "project"]).optional().nullable(),
  availableForWork: z.boolean().default(true),
  contacts: contactsSchema,
  theme: z.enum(["light", "dark", "system"]).default("system"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  uiLocale: z.string().min(2).max(10),
});

export const workInputSchema = z.object({
  sourceUrl: z.string().url().max(2000).optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  result: z.string().max(200).optional(),
  category: z.enum(WORK_CATEGORIES).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

export const hireRequestSchema = z.object({
  profileId: z.string().uuid(),
  workId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  budget: z.string().max(100).optional(),
  message: z.string().min(1).max(2000),
  locale: z.string().min(2).max(10),
  turnstileToken: z.string().min(1),
  // Honeypot: must stay empty. Any non-empty value marks the submission as a bot.
  website: z.string().max(0).optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["profile", "work"]),
  targetId: z.string().uuid(),
  reason: z.enum(["spam", "nsfw", "scam", "copyright", "offensive", "other"]),
  details: z.string().max(1000).optional(),
  reporterEmail: z.string().email().optional(),
  turnstileToken: z.string().min(1),
});

export type ProfileOnboardingInput = z.infer<typeof profileOnboardingSchema>;
export type BulkLinksInput = z.infer<typeof bulkLinksSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type WorkInput = z.infer<typeof workInputSchema>;
export type HireRequestInput = z.infer<typeof hireRequestSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
