import { escapeHtml, sendTransactionalEmail } from "@/lib/email/gmail";

interface SendContactEmailOptions {
  company: string;
  fromEmail: string;
  fromName: string;
  message: string;
  to: string;
}

export async function sendContactEmail(options: SendContactEmailOptions) {
  const submittedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return sendTransactionalEmail({
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
    replyTo: `"${options.fromName}" <${options.fromEmail}>`,
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
    to: options.to,
  });
}
