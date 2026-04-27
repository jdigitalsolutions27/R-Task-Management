export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  return value;
}

export function getSupabaseAnonKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!value) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return value;
}

export function getSupabaseServiceRoleKey() {
  const value =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? process.env.SUPABASE_SECRET_KEY?.trim();

  if (!value) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
    );
  }

  return value;
}

export function getResendApiKey() {
  const value = process.env.RESEND_API_KEY?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: RESEND_API_KEY");
  }

  return value;
}

export function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "R-Task Realty <onboarding@resend.dev>";
}

export function getGmailUser() {
  const value = process.env.GMAIL_USER?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: GMAIL_USER");
  }

  return value;
}

export function getGmailAppPassword() {
  const value = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: GMAIL_APP_PASSWORD");
  }

  return value;
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()?.replace(/^/, "https://");

  if (explicitUrl) {
    return explicitUrl;
  }

  if (vercelUrl) {
    return vercelUrl;
  }

  throw new Error("Missing required environment variable: NEXT_PUBLIC_APP_URL");
}

export function getStorageBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "rtask-private";
}

export function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isGmailSmtpEnabled() {
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}
