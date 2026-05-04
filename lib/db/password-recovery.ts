import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { escapeHtml, sendTransactionalEmail } from "@/lib/email/gmail";
import { getAppUrl } from "@/lib/utils/env";
import { AppError } from "@/lib/utils/http";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findProfileByEmail(email: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to start password recovery right now.", 500);
  }

  return data;
}

function buildRecoveryCallbackUrl(tokenHash: string) {
  const params = new URLSearchParams({
    next: "/reset-password",
    token_hash: tokenHash,
    type: "recovery",
  });

  return `${getAppUrl()}/api/auth/callback?${params.toString()}`;
}

function buildRecoveryEmailHtml(options: { actionLink: string; fullName: string }) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 560px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 18px; overflow: hidden; background: #FFFFFF;">
        <div style="background: linear-gradient(135deg, #0F172A 0%, #16213d 100%); padding: 28px 32px;">
          <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #C9A646;">Secure account recovery</p>
          <h1 style="margin: 0; font-size: 30px; line-height: 1.2; color: #FFFFFF;">Reset your password</h1>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 16px; font-size: 16px;">Hi ${escapeHtml(options.fullName)},</p>
          <p style="margin: 0 0 18px; color: #475569;">We received a request to reset your R-Task password. Use the button below to choose a new password and get back into your workspace.</p>
          <div style="border: 1px solid #E5E7EB; border-radius: 14px; background: #F8FAFC; padding: 18px 20px; margin-bottom: 22px;">
            <p style="margin: 0 0 8px; font-weight: 700; color: #0F172A;">Quick reminder</p>
            <p style="margin: 0; color: #64748B;">For your security, this reset link should only be used by you. If you did not request it, you can ignore this email.</p>
          </div>
          <a href="${options.actionLink}" style="display: inline-block; background: #C9A646; color: #111827; text-decoration: none; font-weight: 700; padding: 13px 20px; border-radius: 10px;">Create a new password</a>
          <p style="margin: 20px 0 0; color: #64748B; font-size: 13px;">If the button does not work, copy and open this link in your browser:</p>
          <p style="margin: 8px 0 0; word-break: break-all; color: #0F172A; font-size: 13px;">${escapeHtml(options.actionLink)}</p>
        </div>
      </div>
    </div>
  `;
}

function buildRecoveryEmailText(options: { actionLink: string; fullName: string }) {
  return [
    `Hi ${options.fullName},`,
    "",
    "We received a request to reset your R-Task password.",
    "Open the link below to choose a new password:",
    "",
    options.actionLink,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

export async function sendPasswordRecoveryEmail(emailInput: string) {
  const admin = createAdminSupabaseClient();
  const email = normalizeEmail(emailInput);
  const profile = await findProfileByEmail(email);

  if (!profile) {
    return { email };
  }

  const redirectTo = `${getAppUrl()}/api/auth/callback?next=/reset-password`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo,
    },
  });

  if (error) {
    if (/user not found|email not found|invalid email/i.test(error.message)) {
      return { email };
    }

    throw new AppError(error.message || "Unable to start password recovery right now.", 400);
  }

  const tokenHash = data?.properties?.hashed_token;

  if (!tokenHash) {
    throw new AppError("Unable to create the password reset link right now.", 500);
  }

  const actionLink = buildRecoveryCallbackUrl(tokenHash);

  await sendTransactionalEmail({
    html: buildRecoveryEmailHtml({
      actionLink,
      fullName: profile.full_name || "there",
    }),
    subject: "Reset your R-Task password",
    text: buildRecoveryEmailText({
      actionLink,
      fullName: profile.full_name || "there",
    }),
    to: email,
  });

  return { email };
}
