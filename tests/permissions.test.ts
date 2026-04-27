import { describe, expect, it } from "vitest";

import { hasCapability } from "@/lib/auth/permissions";

describe("role capabilities", () => {
  it("grants full administrative access to super admins", () => {
    expect(hasCapability("super_admin", "files:approve")).toBe(true);
    expect(hasCapability("super_admin", "settings:manage")).toBe(true);
    expect(hasCapability("super_admin", "evictions:manage")).toBe(true);
  });

  it("allows corporate users to manage approvals and tenant settings", () => {
    expect(hasCapability("corporate_user", "files:approve")).toBe(true);
    expect(hasCapability("corporate_user", "reports:create")).toBe(true);
    expect(hasCapability("corporate_user", "users:approve")).toBe(true);
  });

  it("restricts employees to their upload and support surface", () => {
    expect(hasCapability("employee", "files:upload")).toBe(true);
    expect(hasCapability("employee", "support:create")).toBe(true);
    expect(hasCapability("employee", "reports:view")).toBe(false);
    expect(hasCapability("employee", "settings:manage")).toBe(false);
  });

  it("restricts inspectors to inspection workflows", () => {
    expect(hasCapability("inspector", "inspections:create")).toBe(true);
    expect(hasCapability("inspector", "files:approve")).toBe(false);
    expect(hasCapability("inspector", "reports:create")).toBe(false);
  });
});

