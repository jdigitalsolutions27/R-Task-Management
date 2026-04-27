import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendSpy = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    return {
      emails: {
        send: sendSpy,
      },
    };
  }),
}));

describe("email notifications", () => {
  beforeEach(() => {
    sendSpy.mockReset();
    vi.resetModules();
    process.env.NEXT_PUBLIC_APP_URL = "https://portal.example.com";
    process.env.RESEND_FROM_EMAIL = "R-Task <no-reply@example.com>";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("sends notification emails when Resend is configured", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const { sendNotificationEmail } = await import("@/lib/email/resend");

    await sendNotificationEmail({
      actionLabel: "Review file",
      actionPath: "/files",
      detail: "Lease agreement uploaded",
      subject: "New file uploaded",
      summary: "A file needs review.",
      to: ["reviewer@example.com"],
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy.mock.calls[0][0]).toMatchObject({
      from: "R-Task <no-reply@example.com>",
      subject: "New file uploaded",
      to: ["reviewer@example.com"],
    });
  });

  it("skips delivery when the API key is absent", async () => {
    const { sendNotificationEmail } = await import("@/lib/email/resend");

    await sendNotificationEmail({
      subject: "No send",
      summary: "No key available",
      to: ["reviewer@example.com"],
    });

    expect(sendSpy).not.toHaveBeenCalled();
  });
});
