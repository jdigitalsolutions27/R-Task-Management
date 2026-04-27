function expandShortHex(value: string) {
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }

  return value;
}

export function normalizeHexColor(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim();

  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    return fallback;
  }

  return expandShortHex(normalized).toUpperCase();
}

function hexToRgb(value: string) {
  const normalized = normalizeHexColor(value, "#000000").slice(1);

  return {
    b: Number.parseInt(normalized.slice(4, 6), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    r: Number.parseInt(normalized.slice(0, 2), 16),
  };
}

function rgbToHex({
  b,
  g,
  r,
}: {
  b: number;
  g: number;
  r: number;
}) {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

export function mixHexColors(base: string, mixWith: string, weight: number) {
  const clampedWeight = Math.max(0, Math.min(1, weight));
  const baseRgb = hexToRgb(base);
  const mixRgb = hexToRgb(mixWith);

  return rgbToHex({
    b: baseRgb.b * (1 - clampedWeight) + mixRgb.b * clampedWeight,
    g: baseRgb.g * (1 - clampedWeight) + mixRgb.g * clampedWeight,
    r: baseRgb.r * (1 - clampedWeight) + mixRgb.r * clampedWeight,
  });
}

export function getReadableTextColor(background: string) {
  const { b, g, r } = hexToRgb(background);
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;

  return luminance > 0.45 ? "#111827" : "#FFFFFF";
}
