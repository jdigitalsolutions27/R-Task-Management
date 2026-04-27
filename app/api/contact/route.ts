import { NextResponse } from "next/server";

import { getSiteContent } from "@/lib/db/site-content";
import { sendContactEmail } from "@/lib/email/contact";
import { AppError, createErrorResponse } from "@/lib/utils/http";
import { isGmailSmtpEnabled } from "@/lib/utils/env";
import { contactRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    if (!isGmailSmtpEnabled()) {
      throw new AppError("Contact email is not configured yet.", 503);
    }

    const input = contactRequestSchema.parse(await request.json());
    const siteContent = await getSiteContent();

    const sent = await sendContactEmail({
      company: input.company,
      fromEmail: input.email,
      fromName: input.name,
      message: input.message,
      to: siteContent.contact.details.email,
    });

    if (!sent) {
      throw new AppError("Unable to send your message right now.", 503);
    }

    return NextResponse.json({
      data: {
        deliveredTo: siteContent.contact.details.email,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
