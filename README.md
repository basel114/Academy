# Basel Academy

Basel Academy is a bilingual course catalog and demo booking site. It uses Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth and PostgreSQL.

## Set up the project

1. Install Node.js 22 or newer and run `npm install`.
2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` to the project URL and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Supabase publishable or legacy anon key.
3. In the Supabase SQL editor, run [the migration](supabase/migrations/202611190001_academy.sql) once, then [the seed](supabase/seed.sql). The seed can be rerun. It adds six categories and twelve bilingual courses.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` for local development. Add `http://localhost:3000/auth/confirm**` to **Redirect URLs** so both the confirmation and recovery callback query strings are accepted. Use the corresponding HTTPS URLs for deployed environments.
5. Enable the email/password provider. If email confirmation is enabled, the default Supabase emails work with the browser that requested the email. To support opening emails in another browser, use the optional templates below. Configure SMTP in Supabase if your recipients or volume exceed the project's built-in email sender limits.
6. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

The bundled catalog works without Supabase credentials. Account creation and bookings require a configured project. Course prices are illustrative and bookings do not collect payment. Cancelling removes the booking and permits a new booking later.

## Optional email templates for cross-browser links

Under **Authentication → Emails**, replace the link in the **Confirm signup** template with:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Confirm your email</a>
```

Replace the link in **Reset password** with:

```html
<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery">Reset your password</a>
```

Both URLs supplied by the app contain an initial query parameter. Configure the redirect allowlist before sending emails so Supabase accepts those URLs.

## Verify

- Run `npm run lint`, `npm run typecheck`, and `npm run build`.
- Run [the rollback-only isolation test](supabase/tests/enrollment_rls.sql) in the SQL editor as the database owner after applying the migration and seed. It verifies own-row access, duplicate rejection, profile creation, cross-account read/write isolation, and cancellation.
- Create an account, confirm the email if required, log in, browse and book a course, check My Courses, cancel the booking, then log out. Open a course while logged out and select **Book this course** to check the return path after login.
