import nodemailer from "nodemailer";

import { getGmailAppPassword, getGmailUser, isGmailSmtpEnabled } from "@/lib/utils/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      auth: {
        pass: getGmailAppPassword(),
        user: getGmailUser(),
      },
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    });
  }

  return transporter;
}

interface SendTransactionalEmailOptions {
  html: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: string;
}

export async function sendTransactionalEmail(options: SendTransactionalEmailOptions) {
  if (!options.to || !isGmailSmtpEnabled()) {
    return false;
  }

  await getTransporter().sendMail({
    from: `"R-Task Website" <${getGmailUser()}>`,
    html: options.html,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
    to: options.to,
  });

  return true;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
