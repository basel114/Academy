# Samen Learning — multilingual learning & library MVP

An App Router + TypeScript + Tailwind CSS foundation for Arabic, Dutch and English learning. The app includes localized routes, an accessible responsive demo catalog, course and book details, account flows designed for Supabase SSR, database migrations with RLS, and fictional seed records.

## Architecture

- `src/app/[locale]`: localized pages. `ar` is RTL; `nl` and `en` are LTR.
- `src/i18n`: lightweight locale context, localized links and message lookup.
- `src/lib/demo.ts`: clearly fictional local catalog used without credentials.
- `src/lib/supabase/server.ts`: cookie-based SSR client; returns `null` when unconfigured.
- `src/app/[locale]/courses`: published Supabase course catalog and lesson pages.
- `src/app/[locale]/dashboard`: enrolled-course list with persisted lesson progress.
- `src/app/api/library/[bookSlug]/download`: authenticated, entitlement-checked, short-lived private download link.
- `src/components/book-file-upload.tsx`: admin-only PDF/EPUB upload through Supabase Storage RLS.
- `supabase/migrations`: PostgreSQL schema, triggers, indexes, RLS, private storage bucket.
- `supabase/seed.sql`: fictional, multilingual catalog records.

## Local development

Requires Node.js 20.9 or newer and npm.

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000/en` (or `/ar`, `/nl`). In PowerShell, `Copy-Item` is the environment-file copy command. The public course and book catalog works in demo mode without a Supabase account. Authentication, persisted newsletter subscriptions, student dashboard data and admin access require a Supabase project.

## Connect Supabase

1. Create a free Supabase project and copy its Project URL and publishable/anon key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Install the Supabase CLI and run `supabase login`, `supabase link --project-ref <your-project-ref>`, then `supabase db push`.
3. Paste `supabase/seed.sql` into the project's SQL Editor to add fictional demo catalog records.
4. Configure Auth email confirmation and redirect URLs for `http://localhost:3000/**` in Supabase Auth settings.
5. Set `NEXT_PUBLIC_SITE_URL` to the deployed site URL before password-reset use.
6. To bootstrap the first administrator, create and verify your own account, then run this once in the Supabase SQL Editor with your account email substituted:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

   The database trigger permits role bootstrap from the trusted SQL Editor (where `auth.uid()` is null); authenticated app users cannot change their own role.

Never add a Supabase service-role/secret key to a `NEXT_PUBLIC_` variable or browser code. The starter schema protects roles from self-promotion and allows free enrollment through a database policy and paid enrollment only through a trusted server-side payment webhook.

For payment testing, set `STRIPE_SECRET_KEY` and/or `MOLLIE_API_KEY` using the providers' test credentials. Set `STRIPE_WEBHOOK_SECRET` from the Stripe webhook endpoint configured for `/api/payments/webhook/stripe`. Set `SUPABASE_SERVICE_ROLE_KEY` only on the server so verified webhook handlers can record provider-confirmed state. Mollie payments post to `/api/payments/webhook/mollie`; local webhook testing requires a public HTTPS tunnel because Mollie cannot call localhost. Checkout returns only a pending order; access is granted after an authenticated provider status check. iDEAL availability depends on the connected provider account and merchant setup.

## Vercel

Import this repository into Vercel, select the Next.js preset, set the public Supabase URL/key and site URL in project settings, then deploy. Add server-only service/payment keys only when configuring the associated webhook or checkout. Apply the same migration and seed steps to the linked Supabase project. No public deployment has been made by this project.

## Hostinger

See [HOSTINGER_AR.md](HOSTINGER_AR.md) for the Arabic deployment guide. This project requires Node.js server hosting for Next.js; static PHP hosting alone is not sufficient.

## Functional status

**Working locally:** localized route handling and language switcher, RTL rendering for Arabic, responsive home/catalog/detail pages, fictional sample courses/books, accessible sign-in/register/forgot-password/reset forms, metadata, and server-side Supabase auth calls when configured.

**Needs Supabase credentials/configuration:** account creation, login, reset email, role-backed dashboard, database catalog, newsletter persistence, course enrollment/progress, admin content, and private book storage. Missing credentials do not create fake success.

**Available for configured admins:** create and publish course and book records; add lessons with localized title/body, ordering, duration, preview flag, and allowlisted YouTube/Vimeo links; upload PDF/EPUB files into private Supabase Storage; create articles in all three languages. Course and book records currently save the selected locale only; editing existing records and translation management remain incomplete.

**Working for configured users:** students can enroll in published free courses, view authorized lessons, play allowlisted external video embeds, mark lessons complete, and see progress in their dashboard. Book files are private; the download endpoint checks login and verified purchase status for paid books before issuing a 60-second signed URL. When payment keys and the service key are configured, paid book access is granted only after a provider-verified webhook writes a paid purchase.

Administrators can create live courses and schedule sessions with Europe/Amsterdam time conversion, capacity, cancellation deadlines, and a private meeting link. Student booking uses a transaction-locked database function to prevent overselling; paid-course sessions require a verified paid purchase. The meeting link is stored separately and returned only to an administrator or a student with an active booking. Admins can record attendance after a session.

Paid books and courses can start Stripe Checkout or Mollie hosted payments when their server keys are configured. The app creates a pending purchase from the database price, uses an idempotency key, and verifies webhook notifications against the provider's API before marking orders paid. Course enrollments are created only after that verified transition. Students can request refunds; admin approval sends a full refund request to the provider, and order access is revoked only when the provider confirms completion. Pending refunds can be checked again from the admin dashboard. Payment keys are optional; checkout stays unavailable when they are missing.

**Not implemented yet:** complete admin CRUD, translation editing for existing course/book records, contact form delivery, newsletter confirmation/unsubscribe, rate limiting, structured data, automatic refund-status webhooks, and complete translations of every interface string. No Stripe/Mollie credentials are configured in this workspace, so provider checkout, refund, and webhook flows have not been exercised end-to-end. Video embeds do not prevent recording or downloading.

## Commands

```sh
npm run dev
npm run lint
npm run typecheck
npm run build
```

This workspace started empty, so there was no existing Git repository or app configuration to preserve.
