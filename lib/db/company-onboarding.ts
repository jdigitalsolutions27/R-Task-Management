import { createHash, randomBytes } from "node:crypto";

import { assertCompanySupportEmailAvailable } from "@/lib/db/company-guards";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { escapeHtml, sendTransactionalEmail } from "@/lib/email/gmail";
import { getAppUrl } from "@/lib/utils/env";
import { AppError } from "@/lib/utils/http";
import type { AdminSetupInput } from "@/lib/validation/schemas";
import type { Company } from "@/types/app";

const TOKEN_TTL_HOURS = 72;

type CompanyTokenPurpose = "company_verification" | "admin_setup";

interface OnboardingDispatchResult {
  company: Company;
  delivery: "sent" | "manual";
  purpose: CompanyTokenPurpose;
  url: string;
}

export interface CompanyAdminSetupInvitation {
  company: Pick<Company, "id" | "name" | "slug" | "status">;
  email: string;
  valid: boolean;
}

function createPlainToken() {
  return randomBytes(24).toString("base64url");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getTokenExpiryIso() {
  return new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

function getVerificationPath(token: string) {
  return `/api/company/verify?token=${encodeURIComponent(token)}`;
}

function getAdminSetupPath(token: string, verified = false) {
  const params = new URLSearchParams({ token });

  if (verified) {
    params.set("verified", "1");
  }

  return `/company/admin-setup?${params.toString()}`;
}

function toAbsoluteUrl(path: string) {
  return `${getAppUrl()}${path}`;
}

async function getCompanyOrThrow(companyId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("companies").select("*").eq("id", companyId).single();

  if (error || !data) {
    throw new AppError("Unable to load the company record.", 404);
  }

  return data;
}

async function getCompanyAccessToken(token: string, purpose: CompanyTokenPurpose) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("company_access_tokens")
    .select("*")
    .eq("purpose", purpose)
    .eq("token_hash", hashToken(token))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to validate the onboarding link.", 500);
  }

  return data;
}

async function issueCompanyToken(options: {
  company: Company;
  createdBy?: string | null;
  email: string;
  purpose: CompanyTokenPurpose;
}) {
  const admin = createAdminSupabaseClient();
  const token = createPlainToken();
  const tokenHash = hashToken(token);

  await admin
    .from("company_access_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("company_id", options.company.id)
    .eq("purpose", options.purpose)
    .is("used_at", null);

  const { error } = await admin
    .from("company_access_tokens")
    .insert({
      company_id: options.company.id,
      created_by: options.createdBy ?? null,
      email: options.email,
      expires_at: getTokenExpiryIso(),
      purpose: options.purpose,
      token_hash: tokenHash,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Unable to issue the onboarding link.", 500);
  }

  return {
    token,
  };
}

async function sendCompanyVerificationEmail(company: Company, token: string) {
  if (!company.support_email) {
    throw new AppError("Add a support email before sending company verification.", 400);
  }

  const verificationUrl = toAbsoluteUrl(getVerificationPath(token));

  return sendTransactionalEmail({
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 16px; color: #0F172A;">Verify ${escapeHtml(company.name)} to activate the client workspace</h2>
        <p style="margin: 0 0 16px;">Confirm this support email first. Once verified, you can finish setting up the first admin account for this company.</p>
        <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; background: #F8FAFC; margin-bottom: 20px;">
          <p style="margin: 0 0 8px;"><strong>Company slug:</strong> ${escapeHtml(company.slug)}</p>
          <p style="margin: 0;"><strong>Support email:</strong> ${escapeHtml(company.support_email)}</p>
        </div>
        <a href="${verificationUrl}" style="display: inline-block; background: #C9A646; color: #111827; text-decoration: none; font-weight: 700; padding: 12px 18px; border-radius: 8px;">Verify company email</a>
        <p style="margin: 18px 0 0; font-size: 13px; color: #6B7280;">If the button does not work, open this link: ${escapeHtml(verificationUrl)}</p>
      </div>
    `,
    subject: `Verify ${company.name} to activate the client workspace`,
    text: [
      `Verify ${company.name} to activate the client workspace`,
      "",
      "Confirm this support email first. Once verified, you can finish setting up the first admin account for this company.",
      "",
      `Company slug: ${company.slug}`,
      `Support email: ${company.support_email}`,
      "",
      `Verification link: ${verificationUrl}`,
    ].join("\n"),
    to: company.support_email,
  });
}

async function sendAdminSetupEmail(company: Company, token: string) {
  if (!company.support_email) {
    throw new AppError("Add a support email before sending the admin setup link.", 400);
  }

  const adminSetupUrl = toAbsoluteUrl(getAdminSetupPath(token, true));

  return sendTransactionalEmail({
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 16px; color: #0F172A;">Finish the first admin setup for ${escapeHtml(company.name)}</h2>
        <p style="margin: 0 0 16px;">Your company email is now verified. Use this secure link to create the first company admin account.</p>
        <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; background: #F8FAFC; margin-bottom: 20px;">
          <p style="margin: 0 0 8px;"><strong>Company slug:</strong> ${escapeHtml(company.slug)}</p>
          <p style="margin: 0;"><strong>Support email:</strong> ${escapeHtml(company.support_email)}</p>
        </div>
        <a href="${adminSetupUrl}" style="display: inline-block; background: #C9A646; color: #111827; text-decoration: none; font-weight: 700; padding: 12px 18px; border-radius: 8px;">Set up the first admin account</a>
        <p style="margin: 18px 0 0; font-size: 13px; color: #6B7280;">If the button does not work, open this link: ${escapeHtml(adminSetupUrl)}</p>
      </div>
    `,
    subject: `Finish the first admin setup for ${company.name}`,
    text: [
      `Finish the first admin setup for ${company.name}`,
      "",
      "Your company email is now verified. Use this secure link to create the first company admin account.",
      "",
      `Company slug: ${company.slug}`,
      `Support email: ${company.support_email}`,
      "",
      `Admin setup link: ${adminSetupUrl}`,
    ].join("\n"),
    to: company.support_email,
  });
}

async function setVerificationSentAt(companyId: string) {
  const admin = createAdminSupabaseClient();

  await admin
    .from("companies")
    .update({ support_email_verification_sent_at: new Date().toISOString() })
    .eq("id", companyId);
}

export async function dispatchCompanyOnboardingAction(options: {
  companyId: string;
  action: "send_verification" | "send_admin_setup";
  actorId?: string | null;
}): Promise<OnboardingDispatchResult> {
  const company = await getCompanyOrThrow(options.companyId);

  if (!company.support_email) {
    throw new AppError("Add a support email before sending onboarding links.", 400);
  }

  if (!company.first_admin_user_id) {
    await assertCompanySupportEmailAvailable({
      companyId: company.id,
      supportEmail: company.support_email,
    });
  }

  if (options.action === "send_verification") {
    if (company.first_admin_user_id) {
      throw new AppError("This company already has an active admin account.", 409);
    }

    const { token } = await issueCompanyToken({
      company,
      createdBy: options.actorId ?? null,
      email: company.support_email,
      purpose: "company_verification",
    });
    const url = toAbsoluteUrl(getVerificationPath(token));

    try {
      const sent = await sendCompanyVerificationEmail(company, token);
      await setVerificationSentAt(company.id);
      return { company, delivery: sent ? "sent" : "manual", purpose: "company_verification", url };
    } catch {
      await setVerificationSentAt(company.id);
      return { company, delivery: "manual", purpose: "company_verification", url };
    }
  }

  if (company.first_admin_user_id) {
    throw new AppError("This company already has an active admin account.", 409);
  }

  if (company.status === "pending_verification") {
    throw new AppError("Verify the company support email before sending the admin setup link.", 409);
  }

  const { token } = await issueCompanyToken({
    company,
    createdBy: options.actorId ?? null,
    email: company.support_email,
    purpose: "admin_setup",
  });
  const url = toAbsoluteUrl(getAdminSetupPath(token, true));

  try {
    const sent = await sendAdminSetupEmail(company, token);
    return { company, delivery: sent ? "sent" : "manual", purpose: "admin_setup", url };
  } catch {
    return { company, delivery: "manual", purpose: "admin_setup", url };
  }
}

export async function verifyCompanySupportEmail(token: string) {
  const tokenRow = await getCompanyAccessToken(token, "company_verification");

  if (!tokenRow) {
    throw new AppError("This company verification link is invalid.", 400);
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    throw new AppError("This company verification link has expired.", 400);
  }

  const admin = createAdminSupabaseClient();
  const company = await getCompanyOrThrow(tokenRow.company_id);

  if (!company.first_admin_user_id) {
    await admin
      .from("company_access_tokens")
      .update({ used_at: tokenRow.used_at ?? new Date().toISOString() })
      .eq("id", tokenRow.id);

    await admin
      .from("companies")
      .update({
        status: "verified",
        support_email_verified_at: company.support_email_verified_at ?? new Date().toISOString(),
      })
      .eq("id", company.id);
  }

  return dispatchCompanyOnboardingAction({
    companyId: company.id,
    action: "send_admin_setup",
    actorId: tokenRow.created_by,
  });
}

export async function resolveCompanyVerificationRedirect(token: string) {
  const tokenRow = await getCompanyAccessToken(token, "company_verification");

  if (!tokenRow) {
    throw new AppError("This company verification link is invalid.", 400);
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    throw new AppError("This company verification link has expired.", 400);
  }

  const company = await getCompanyOrThrow(tokenRow.company_id);

  if (company.first_admin_user_id) {
    return {
      url: `${getAppUrl()}/login?admin-ready=1`,
    };
  }

  if (company.status === "verified" || company.status === "active") {
    const result = await dispatchCompanyOnboardingAction({
      companyId: company.id,
      action: "send_admin_setup",
      actorId: tokenRow.created_by,
    });

    return {
      url: result.url,
    };
  }

  const result = await verifyCompanySupportEmail(token);

  return {
    url: result.url,
  };
}

export async function getCompanyAdminSetupInvitation(token: string): Promise<CompanyAdminSetupInvitation> {
  const tokenRow = await getCompanyAccessToken(token, "admin_setup");

  if (!tokenRow) {
    return {
      company: { id: "", name: "", slug: "", status: "pending_verification" },
      email: "",
      valid: false,
    };
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return {
      company: { id: tokenRow.company_id, name: "", slug: "", status: "pending_verification" },
      email: tokenRow.email,
      valid: false,
    };
  }

  const company = await getCompanyOrThrow(tokenRow.company_id);

  return {
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      status: company.status,
    },
    email: tokenRow.email,
    valid: !tokenRow.used_at && !company.first_admin_user_id,
  };
}

export async function completeCompanyAdminSetup(input: AdminSetupInput) {
  const tokenRow = await getCompanyAccessToken(input.token, "admin_setup");

  if (!tokenRow) {
    throw new AppError("This admin setup link is invalid.", 400);
  }

  if (tokenRow.used_at) {
    throw new AppError("This admin setup link has already been used.", 409);
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    throw new AppError("This admin setup link has expired.", 400);
  }

  const company = await getCompanyOrThrow(tokenRow.company_id);

  if (company.first_admin_user_id) {
    throw new AppError("This company already has an admin account. Sign in instead.", 409);
  }

  if (company.status === "pending_verification") {
    throw new AppError("Verify the company email before creating the first admin account.", 409);
  }

  await assertCompanySupportEmailAvailable({
    companyId: company.id,
    supportEmail: tokenRow.email,
  });

  const admin = createAdminSupabaseClient();
  const originalStatus = company.status;
  const originalActivatedAt = company.activated_at;
  const activationTimestamp = new Date().toISOString();

  await admin
    .from("companies")
    .update({
      activated_at: company.activated_at ?? activationTimestamp,
      status: "active",
      support_email_verified_at: company.support_email_verified_at ?? activationTimestamp,
    })
    .eq("id", company.id);

  const { data, error } = await admin.auth.admin.createUser({
    email: tokenRow.email,
    email_confirm: true,
    password: input.password,
    user_metadata: {
      company_slug: company.slug,
      full_name: input.fullName,
      role: "employee",
    },
  });

  if (error || !data.user) {
    await admin
      .from("companies")
      .update({
        activated_at: originalActivatedAt,
        status: originalStatus,
      })
      .eq("id", company.id);

    if (error && /already registered|already exists/i.test(error.message)) {
      throw new AppError(
        "This support email is already tied to an existing account. Update the company support email or sign in with that account instead.",
        409,
      );
    }

    throw new AppError(error?.message ?? "Unable to create the company admin account.", 400);
  }

  try {
    const approvedAt = new Date().toISOString();

    const { error: userUpdateError } = await admin
      .from("users")
      .update({
        approved_at: approvedAt,
        full_name: input.fullName,
        role: "super_admin",
        status: "approved",
      })
      .eq("id", data.user.id);

    if (userUpdateError) {
      throw new AppError("Unable to finish the admin account setup.", 500);
    }

    const { error: companyUpdateError } = await admin
      .from("companies")
      .update({
        activated_at: company.activated_at ?? activationTimestamp,
        first_admin_user_id: data.user.id,
        status: "active",
        support_email_verified_at: company.support_email_verified_at ?? activationTimestamp,
      })
      .eq("id", company.id);

    if (companyUpdateError) {
      throw new AppError("Unable to activate the company admin account.", 500);
    }

    await admin
      .from("company_access_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("company_id", company.id)
      .eq("purpose", "admin_setup")
      .is("used_at", null);
  } catch (error) {
    await admin.auth.admin.deleteUser(data.user.id);
    await admin
      .from("companies")
      .update({
        activated_at: originalActivatedAt,
        first_admin_user_id: null,
        status: originalStatus,
      })
      .eq("id", company.id);

    throw error;
  }

  return {
    companySlug: company.slug,
    email: tokenRow.email,
  };
}
