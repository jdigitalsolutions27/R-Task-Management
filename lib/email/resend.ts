import { Resend } from "resend";

import { NotificationEmail } from "@/lib/email/templates";
import {
  getAppUrl,
  getResendApiKey,
  getResendFromEmail,
  isEmailEnabled,
} from "@/lib/utils/env";

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(getResendApiKey());
  }

  return resendClient;
}

interface SendNotificationEmailOptions {
  actionPath?: string;
  actionLabel?: string;
  detail?: string;
  subject: string;
  summary: string;
  to: string[];
}

export async function sendNotificationEmail(options: SendNotificationEmailOptions) {
  if (!options.to.length || !isEmailEnabled()) {
    return false;
  }

  const actionUrl = options.actionPath ? `${getAppUrl()}${options.actionPath}` : undefined;

  await getResendClient().emails.send({
    from: getResendFromEmail(),
    subject: options.subject,
    to: options.to,
    react: NotificationEmail({
      actionLabel: options.actionLabel,
      actionUrl,
      detail: options.detail,
      headline: options.subject,
      summary: options.summary,
    }),
  });

  return true;
}

interface SendContactEmailOptions {
  company: string;
  fromEmail: string;
  fromName: string;
  message: string;
  to: string;
}

export async function sendContactEmail(options: SendContactEmailOptions) {
  if (!options.to || !isEmailEnabled()) {
    return false;
  }

  const submittedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  await getResendClient().emails.send({
    from: getResendFromEmail(),
    to: [options.to],
    replyTo: options.fromEmail,
    subject: `New website inquiry from ${options.company}`,
    text: [
      "New website contact request",
      "",
      `Name: ${options.fromName}`,
      `Email: ${options.fromEmail}`,
      `Company: ${options.company}`,
      `Submitted: ${submittedAt}`,
      "",
      "Message:",
      options.message,
    ].join("\n"),
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 16px; color: #0F172A;">New website contact request</h2>
        <table style="border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Name</td><td style="padding: 4px 0;">${escapeHtml(options.fromName)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Email</td><td style="padding: 4px 0;">${escapeHtml(options.fromEmail)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Company</td><td style="padding: 4px 0;">${escapeHtml(options.company)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Submitted</td><td style="padding: 4px 0;">${escapeHtml(submittedAt)}</td></tr>
        </table>
        <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; background: #F8FAFC;">
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(options.message)}</p>
        </div>
      </div>
    `,
  });

  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
