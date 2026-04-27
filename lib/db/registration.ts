import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { escapeHtml, sendTransactionalEmail } from "@/lib/email/gmail";
import { getAppUrl } from "@/lib/utils/env";
import { AppError } from "@/lib/utils/http";
import type { RegisterInput } from "@/lib/validation/schemas";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSlug(slug?: string | null) {
  return slug?.trim().toLowerCase() || null;
}

function normalizeInviteCode(inviteCode?: string | null) {
  return inviteCode?.trim().toUpperCase() || null;
}

async function findExistingAuthUserByEmail(email: string) {
  const admin = createAdminSupabaseClient();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new AppError("Unable to check whether this email is already registered.", 500);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email);

    if (match) {
      return match;
    }

    if (!data.nextPage || data.users.length < perPage) {
      return null;
    }

    page = data.nextPage;
  }
}

async function assertSignupEmailAvailable(email: string) {
  const admin = createAdminSupabaseClient();
  const normalizedEmail = normalizeEmail(email);
  const [{ data: existingProfile, error: profileError }, authUser] = await Promise.all([
    admin.from("users").select("id, email").eq("email", normalizedEmail).limit(1).maybeSingle(),
    findExistingAuthUserByEmail(normalizedEmail),
  ]);

  if (profileError) {
    throw new AppError("Unable to check whether this email is already registered.", 500);
  }

  if (existingProfile || authUser) {
    throw new AppError("An account already exists for this email. Sign in or reset the password instead.", 409);
  }
}

async function assertSignupTargetIsReady(input: RegisterInput) {
  const admin = createAdminSupabaseClient();
  const inviteCode = normalizeInviteCode(input.inviteCode);
  const companySlug = normalizeSlug(input.companySlug);

  if (inviteCode) {
    const { data: inviteRow, error: inviteError } = await admin
      .from("company_invite_codes")
      .select("id, company_id, role, active, expires_at, max_uses, used_count")
      .eq("code", inviteCode)
      .limit(1)
      .maybeSingle();

    if (inviteError) {
      throw new AppError("Unable to validate the invite code right now.", 500);
    }

    if (inviteRow) {
      if (!inviteRow.active) {
        throw new AppError("This invite code is no longer active.", 409);
      }

      if (inviteRow.expires_at && new Date(inviteRow.expires_at).getTime() <= Date.now()) {
        throw new AppError("This invite code has expired.", 409);
      }

      if (inviteRow.max_uses !== null && inviteRow.used_count >= inviteRow.max_uses) {
        throw new AppError("This invite code has already reached its usage limit.", 409);
      }

      const { data: company, error: companyError } = await admin
        .from("companies")
        .select("id, name, slug, status")
        .eq("id", inviteRow.company_id)
        .limit(1)
        .maybeSingle();

      if (companyError) {
        throw new AppError("Unable to confirm the company tied to this invite code.", 500);
      }

      if (!company) {
        throw new AppError("The company tied to this invite code could not be found.", 404);
      }

      if (company.status !== "active") {
        throw new AppError("This company is not active yet. Ask the company admin to finish setup first.", 409);
      }

      return {
        companySlug: company.slug,
        inviteCode,
      };
    }
  }

  if (!companySlug) {
    throw new AppError("Enter an active company slug or a valid invite code.", 422);
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, slug, status")
    .eq("slug", companySlug)
    .limit(1)
    .maybeSingle();

  if (companyError) {
    throw new AppError("Unable to verify the company slug right now.", 500);
  }

  if (!company) {
    throw new AppError("That company slug could not be found. Check it and try again.", 404);
  }

  if (company.status !== "active") {
    throw new AppError("This company is not active yet. Ask the company admin to finish setup first.", 409);
  }

  return {
    companySlug: company.slug,
    inviteCode,
  };
}

function buildSignupEmailHtml(options: { actionLink: string; companySlug: string; fullName: string }) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin: 0 0 16px; color: #0F172A;">Verify your R-Task account</h2>
      <p style="margin: 0 0 16px;">Hi ${escapeHtml(options.fullName)}, confirm your email to finish creating your secure account.</p>
      <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; background: #F8FAFC; margin-bottom: 20px;">
        <p style="margin: 0 0 8px;"><strong>Company slug:</strong> ${escapeHtml(options.companySlug)}</p>
        <p style="margin: 0;">This verification link will activate your sign-up request and send you back to the login screen.</p>
      </div>
      <a href="${options.actionLink}" style="display: inline-block; background: #C9A646; color: #111827; text-decoration: none; font-weight: 700; padding: 12px 18px; border-radius: 8px;">Verify my email</a>
      <p style="margin: 18px 0 0; font-size: 13px; color: #6B7280;">If the button does not work, open this link: ${escapeHtml(options.actionLink)}</p>
    </div>
  `;
}

function buildSignupEmailText(options: { actionLink: string; companySlug: string; fullName: string }) {
  return [
    `Hi ${options.fullName},`,
    "",
    "Confirm your email to finish creating your secure R-Task account.",
    "",
    `Company slug: ${options.companySlug}`,
    "",
    `Verification link: ${options.actionLink}`,
  ].join("\n");
}

function buildSignupVerificationCallbackUrl(tokenHash: string) {
  const params = new URLSearchParams({
    next: "/login?confirmed=1",
    token_hash: tokenHash,
    type: "signup",
  });

  return `${getAppUrl()}/api/auth/callback?${params.toString()}`;
}

export async function registerUserWithEmailVerification(input: RegisterInput) {
  const admin = createAdminSupabaseClient();
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  const role = input.role;
  const { companySlug, inviteCode } = await assertSignupTargetIsReady(input);

  await assertSignupEmailAvailable(email);

  const redirectTo = `${getAppUrl()}/api/auth/callback?next=/login?confirmed=1`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: input.password,
    options: {
      redirectTo,
      data: {
        company_slug: companySlug,
        full_name: fullName,
        invite_code: inviteCode,
        role,
      },
    },
  });

  if (error || !data?.properties?.hashed_token || !data.user?.id) {
    if (error && /already registered|already exists/i.test(error.message)) {
      throw new AppError("An account already exists for this email. Sign in or reset the password instead.", 409);
    }

    throw new AppError(error?.message ?? "Unable to start the secure signup right now.", 400);
  }

  try {
    const actionLink = buildSignupVerificationCallbackUrl(data.properties.hashed_token);

    await sendTransactionalEmail({
      html: buildSignupEmailHtml({
        actionLink,
        companySlug,
        fullName,
      }),
      subject: "Verify your R-Task account",
      text: buildSignupEmailText({
        actionLink,
        companySlug,
        fullName,
      }),
      to: email,
    });
  } catch (mailError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new AppError(
      mailError instanceof Error ? mailError.message : "Unable to send the verification email right now.",
      500,
    );
  }

  return {
    email,
  };
}
