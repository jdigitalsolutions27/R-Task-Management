import { z } from "zod";

const companyColor = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Use a valid hex color value.");

const optionalImageUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a valid image URL."),
]);

const optionalDateTimeInput = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.")
      .transform((value) => new Date(value).toISOString()),
  ]);

const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const passwordRecoveryRequestSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your new password."),
    password: strongPassword,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const registerSchema = z
  .object({
    companySlug: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .refine(
        (value) => !value || /^[a-z0-9-]+$/.test(value),
        "Use lowercase letters, numbers, and hyphens only.",
      ),
    email: z.email("Enter a valid email address."),
    fullName: z.string().trim().min(2, "Enter your full name."),
    inviteCode: z.string().trim().optional(),
    password: strongPassword,
    role: z.enum(["corporate_user", "employee", "inspector"]),
  })
  .refine((value) => Boolean(value.companySlug || value.inviteCode), {
    message: "Enter a company slug or invite code.",
    path: ["companySlug"],
  });

export const propertySchema = z.object({
  addressLine1: z.string().trim().min(4, "Address line 1 is required."),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required."),
  country: z.string().trim().min(2, "Country is required."),
  name: z.string().trim().min(2, "Property name is required."),
  postalCode: z.string().trim().min(2, "Postal code is required."),
  referenceCode: z.string().trim().min(2, "Reference code is required."),
  state: z.string().trim().min(2, "State or province is required."),
  status: z.enum(["active", "inactive"]),
});

export const uploadRecordSchema = z.object({
  category: z.enum([
    "general",
    "inspection",
    "shopping_report",
    "eviction",
    "photo",
    "video",
    "pdf",
  ]),
  description: z.string().trim().max(500).optional(),
  evictionId: z.string().uuid().optional(),
  fileName: z.string().trim().min(1, "File name is required."),
  inspectionId: z.string().uuid().optional(),
  mimeType: z.string().trim().min(1, "MIME type is required."),
  module: z.enum(["files", "inspections", "shopping_reports", "evictions"]),
  originalName: z.string().trim().min(1, "Original file name is required."),
  propertyId: z.string().uuid("Select a property."),
  reportId: z.string().uuid().optional(),
  sizeBytes: z
    .number({ error: "File size is required." })
    .int()
    .positive("File size must be greater than zero.")
    .max(1024 * 1024 * 1024, "Files may not exceed 1 GB."),
  storagePath: z.string().trim().min(4, "Storage path is required."),
});

export const fileStatusSchema = z
  .object({
    comment: z.string().trim().max(500).optional(),
    status: z.enum(["approved", "rejected"]),
  })
  .refine((value) => (value.status === "rejected" ? Boolean(value.comment) : true), {
    message: "A rejection comment is required.",
    path: ["comment"],
  });

export const inspectionSchema = z.object({
  completedAt: optionalDateTimeInput,
  propertyId: z.string().uuid("Select a property."),
  reportFileId: z.string().uuid().optional().or(z.literal("")),
  scheduledFor: optionalDateTimeInput,
  status: z.enum(["scheduled", "completed", "cancelled"]),
  summary: z.string().trim().max(1000).optional(),
  title: z.string().trim().min(3, "Inspection title is required."),
});

export const reportSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  propertyId: z.string().uuid("Select a property."),
  reportDate: z.string().date("Select a valid report date."),
  reportFileId: z.string().uuid("Attach the primary report file."),
  status: z.enum(["draft", "published", "archived"]),
  title: z.string().trim().min(3, "Report title is required."),
  videoFileId: z.string().uuid().optional().or(z.literal("")),
});

export const evictionSchema = z.object({
  completedAt: optionalDateTimeInput,
  documentFileId: z.string().uuid().optional().or(z.literal("")),
  filedAt: optionalDateTimeInput,
  propertyId: z.string().uuid("Select a property."),
  status: z.enum(["draft", "filed", "completed"]),
  summary: z.string().trim().max(1000).optional(),
  title: z.string().trim().min(3, "Eviction title is required."),
});

export const supportSchema = z.object({
  message: z.string().trim().min(10, "Enter the details for support."),
  subject: z.string().trim().min(3, "Support subject is required."),
});

export const contactRequestSchema = z.object({
  company: z.string().trim().min(2, "Company is required."),
  email: z.email("Enter a valid email address."),
  message: z.string().trim().min(10, "Enter a short message."),
  name: z.string().trim().min(2, "Name is required."),
});

export const profileSettingsSchema = z.object({
  contactNumber: z
    .string()
    .trim()
    .max(30, "Contact number must be 30 characters or fewer.")
    .regex(/^[0-9+() -]*$/, "Use a valid contact number.")
    .optional()
    .or(z.literal("")),
  fullName: z.string().trim().min(2, "Enter your full name."),
});

export const companySettingsSchema = z.object({
  backgroundColor: companyColor,
  inviteApprovalRequired: z.boolean(),
  logoUrl: optionalImageUrl,
  name: z.string().trim().min(2, "Company name is required."),
  primaryColor: companyColor,
  secondaryColor: companyColor,
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  supportEmail: z.email("Enter a valid support email."),
});

export const tenantCompanySettingsSchema = z.object({
  backgroundColor: companyColor,
  inviteApprovalRequired: z.boolean(),
  logoUrl: optionalImageUrl,
  primaryColor: companyColor,
  secondaryColor: companyColor,
});

export const adminSetupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name."),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirm your password."),
    token: z.string().trim().min(10, "The setup link is invalid."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const inviteCodeSchema = z.object({
  active: z.boolean().default(true),
  expiresAt: optionalDateTimeInput,
  maxUses: z.number().int().positive().max(1000).optional(),
  role: z.enum(["corporate_user", "employee", "inspector"]),
});

export const platformUserUpdateSchema = z.object({
  role: z.enum(["super_admin", "corporate_user", "employee", "inspector"]),
  status: z.enum(["approved", "pending", "rejected"]),
  userId: z.string().uuid(),
});

const siteImageSchema = z.object({
  alt: z.string().trim().min(2, "Enter image alt text."),
  url: z.string().trim().min(1, "Enter an image URL."),
});

const siteLinkSchema = z.object({
  href: z.string().trim().min(1, "Enter a link destination."),
  label: z.string().trim().min(1, "Enter a link label."),
});

const siteFeatureSchema = z.object({
  description: z.string().trim().min(1, "Enter a description."),
  title: z.string().trim().min(1, "Enter a title."),
});

const siteSocialLinkSchema = z.object({
  label: z.string().trim().min(1, "Enter a social label."),
  url: z.string().trim().url("Enter a valid social link."),
});

export const siteContentSchema = z.object({
  header: z.object({
    portalCta: siteLinkSchema,
  }),
  about: z.object({
    feature: siteFeatureSchema,
    hero: z.object({
      description: z.string().trim().min(1, "Enter hero description."),
      image: siteImageSchema,
      kicker: z.string().trim().min(1, "Enter hero kicker."),
      title: z.string().trim().min(1, "Enter hero title."),
    }),
    image: siteImageSchema,
    note: siteFeatureSchema,
    paragraphs: z.array(z.string().trim().min(1, "Enter a paragraph.")).min(1),
    strengths: z.array(z.string().trim().min(1, "Enter a strength.")).min(1),
  }),
  contact: z.object({
    details: z.object({
      address: z.string().trim().min(1, "Enter an address."),
      email: z.email("Enter a valid contact email."),
      phone: z.string().trim().min(1, "Enter a phone number."),
      privacyNote: z.string().trim().min(1, "Enter a privacy note."),
      responseTime: z.string().trim().min(1, "Enter response time text."),
      supportNote: z.string().trim().min(1, "Enter a support note."),
      whatsApp: z.string().trim().min(1, "Enter a WhatsApp number."),
    }),
    hero: z.object({
      description: z.string().trim().min(1, "Enter hero description."),
      image: siteImageSchema,
      kicker: z.string().trim().min(1, "Enter hero kicker."),
      title: z.string().trim().min(1, "Enter hero title."),
    }),
    request: z.object({
      description: z.string().trim().min(1, "Enter request description."),
      kicker: z.string().trim().min(1, "Enter request kicker."),
      primaryCta: siteLinkSchema,
      secondaryCta: siteLinkSchema,
      title: z.string().trim().min(1, "Enter request title."),
    }),
  }),
  footer: z.object({
    address: z.string().trim().min(1, "Enter a footer address."),
    backgroundImage: siteImageSchema,
    email: z.email("Enter a valid footer email."),
    phone: z.string().trim().min(1, "Enter a footer phone number."),
    responseNote: z.string().trim().min(1, "Enter a response note."),
    socials: z.array(siteSocialLinkSchema).min(1),
    tagline: z.string().trim().min(1, "Enter a footer tagline."),
    whatsApp: z.string().trim().min(1, "Enter a footer WhatsApp number."),
  }),
  home: z.object({
    coverage: z.object({
      description: z.string().trim().min(1, "Enter coverage description."),
      highlights: z.array(siteFeatureSchema).min(1),
      image: siteImageSchema,
      imageLabel: z.string().trim().min(1, "Enter an image label."),
      kicker: z.string().trim().min(1, "Enter coverage kicker."),
      title: z.string().trim().min(1, "Enter coverage title."),
    }),
    hero: z.object({
      description: z.string().trim().min(1, "Enter hero description."),
      image: siteImageSchema,
      kicker: z.string().trim().min(1, "Enter hero kicker."),
      primaryCta: siteLinkSchema,
      secondaryCta: siteLinkSchema,
      title: z.string().trim().min(1, "Enter hero title."),
      trustLine: z.string().trim().min(1, "Enter trust line text."),
    }),
    workflow: z.object({
      description: z.string().trim().min(1, "Enter workflow description."),
      kicker: z.string().trim().min(1, "Enter workflow kicker."),
      steps: z.array(siteFeatureSchema).min(1),
      title: z.string().trim().min(1, "Enter workflow title."),
    }),
  }),
  services: z.object({
    hero: z.object({
      description: z.string().trim().min(1, "Enter services hero description."),
      image: siteImageSchema,
      kicker: z.string().trim().min(1, "Enter services hero kicker."),
      title: z.string().trim().min(1, "Enter services hero title."),
    }),
    services: z.array(siteFeatureSchema).min(1),
    trust: z.object({
      description: z.string().trim().min(1, "Enter trust description."),
      kicker: z.string().trim().min(1, "Enter trust kicker."),
      points: z.array(siteFeatureSchema).min(1),
      title: z.string().trim().min(1, "Enter trust title."),
    }),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordRecoveryRequestInput = z.infer<typeof passwordRecoveryRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type UploadRecordInput = z.infer<typeof uploadRecordSchema>;
export type FileStatusInput = z.infer<typeof fileStatusSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type EvictionInput = z.infer<typeof evictionSchema>;
export type SupportInput = z.infer<typeof supportSchema>;
export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type TenantCompanySettingsInput = z.infer<typeof tenantCompanySettingsSchema>;
export type InviteCodeInput = z.infer<typeof inviteCodeSchema>;
export type PlatformUserUpdateInput = z.infer<typeof platformUserUpdateSchema>;
export type SiteContentInput = z.infer<typeof siteContentSchema>;
export type AdminSetupInput = z.infer<typeof adminSetupSchema>;
