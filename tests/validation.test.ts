import { describe, expect, it } from "vitest";

import {
  fileStatusSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";

describe("validation schemas", () => {
  it("requires a company slug or invite code for signup", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      fullName: "Test User",
      password: "StrongPassword123",
      role: "employee",
    });

    expect(result.success).toBe(false);
  });

  it("accepts signup with an invite code", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      fullName: "Test User",
      inviteCode: "ABC123",
      password: "StrongPassword123",
      role: "employee",
    });

    expect(result.success).toBe(true);
  });

  it("requires a rejection comment when rejecting a file", () => {
    const result = fileStatusSchema.safeParse({
      comment: "",
      status: "rejected",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an approval without a comment", () => {
    const result = fileStatusSchema.safeParse({
      status: "approved",
    });

    expect(result.success).toBe(true);
  });

  it("requires matching password reset fields", () => {
    const result = resetPasswordSchema.safeParse({
      confirmPassword: "DifferentPassword123",
      password: "StrongPassword123",
    });

    expect(result.success).toBe(false);
  });
});
