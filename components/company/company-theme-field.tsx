"use client";

import { Palette } from "lucide-react";

const themeFields = [
  {
    key: "primaryColor",
    label: "Main brand color",
  },
  {
    key: "secondaryColor",
    label: "Accent color",
  },
  {
    key: "backgroundColor",
    label: "Workspace background",
  },
] as const;

export function CompanyThemeField({
  backgroundColor,
  onChange,
  primaryColor,
  secondaryColor,
}: {
  backgroundColor: string;
  onChange: (
    field: "primaryColor" | "secondaryColor" | "backgroundColor",
    value: string,
  ) => void;
  primaryColor: string;
  secondaryColor: string;
}) {
  const values = { backgroundColor, primaryColor, secondaryColor };

  return (
    <div className="space-y-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div>
        <h4 className="text-sm font-semibold text-[#111827]">Company theme</h4>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid items-start gap-3 sm:grid-cols-3">
          {themeFields.map((field) => (
            <div
              className="self-start rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              key={field.key}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827]">{field.label}</p>
                </div>
                <label
                  className="relative block h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#E2E8F0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                  style={{ backgroundColor: values[field.key] }}
                >
                  <input
                    aria-label={field.label}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => onChange(field.key, event.target.value.toUpperCase())}
                    type="color"
                    value={values[field.key]}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl border border-[#E2E8F0] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
          style={{ backgroundColor }}
        >
          <div className="rounded-xl p-4 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Palette className="h-4 w-4" style={{ color: secondaryColor }} />
              Theme preview
            </div>
            <p className="mt-3 text-lg font-bold">Company workspace</p>
            <p className="mt-1 text-sm text-white/80">
              This is a quick preview of how the company branding feels inside the app.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-[#111827] shadow-[0_10px_20px_rgba(15,23,42,0.14)]"
                style={{ backgroundColor: secondaryColor }}
              >
                Action button
              </span>
              <span className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white">
                Panel surface
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
