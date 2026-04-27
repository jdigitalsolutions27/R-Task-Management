# R-Task Realty & Property Management Solutions

Multi-tenant property management SaaS built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, Resend, Zod, and React Hook Form.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Supabase Auth, Postgres, Storage, RLS
- Email: Resend
- Validation: Zod
- Forms: React Hook Form
- Testing: Vitest

## Application Surface

Public routes:

- `/`
- `/about`
- `/services`
- `/contact`
- `/login`

Protected routes:

- `/dashboard`
- `/files`
- `/approvals`
- `/inspections`
- `/shopping-reports`
- `/evictions`
- `/support`
- `/settings`

## Core Features

- Multi-tenant company isolation
- Role-based authentication and authorization
- Private Supabase Storage with signed downloads
- Resumable browser uploads for PDF, image, and video files up to 1 GB
- Approval workflow with pending, approved, rejected states
- Inspection, shopping report, eviction, support, and notification modules
- Audit logging for uploads, approvals, and downloads
- Email notifications through Resend

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values.

3. Create a Supabase project and run the migration in [`supabase/migrations/0001_initial_schema.sql`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/supabase/migrations/0001_initial_schema.sql).

4. In Supabase Auth:
   - Enable email/password sign-in
   - Set the site URL to your app URL
   - Add `${NEXT_PUBLIC_APP_URL}/api/auth/callback` as a redirect URL
   - Password recovery should redirect through `${NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`

5. Start the app:

   ```bash
   npm run dev
   ```

## Environment Variables

See [`.env.example`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/.env.example).

Required:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Supabase Bootstrap Notes

### First Company

Create the first company record in SQL:

```sql
insert into public.companies (name, slug, support_email)
values ('R-Task Realty', 'rtask-realty', 'support@example.com');
```

### First Super Admin

Create the auth user in Supabase Auth first, then insert the matching public profile using that auth UUID:

```sql
insert into public.users (
  id,
  company_id,
  email,
  full_name,
  role,
  status,
  approved_at
)
values (
  '<auth-user-uuid>',
  '<company-uuid>',
  'admin@example.com',
  'Platform Admin',
  'super_admin',
  'approved',
  timezone('utc', now())
);
```

Self-signup is enabled for standard users through `/login`. The trigger in the migration links users to a company by invite code or company slug and sets approval state accordingly.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Tests

The Vitest suite covers:

- Role capability enforcement
- File validation and resumable upload configuration
- Signup and approval validation rules
- Email notification dispatch behavior

## Deployment

### Vercel

1. Import the project into Vercel.
2. Add the same environment variables used locally.
3. Set `NEXT_PUBLIC_APP_URL` to the production URL.
4. Deploy with `npm run build`.

### Supabase

1. Apply [`supabase/migrations/0001_initial_schema.sql`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/supabase/migrations/0001_initial_schema.sql).
2. Confirm RLS is enabled on all application tables.
3. Confirm the `rtask-private` storage bucket exists and is private.
4. Confirm Auth redirect URLs include `/api/auth/callback`.

## Project Layout

- [`app`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/app)
- [`components`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/components)
- [`lib`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/lib)
- [`types`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/types)
- [`supabase`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/supabase)
- [`tests`](/e:/MANAGEMENT%20SYSTEM%20R-TASK/tests)
