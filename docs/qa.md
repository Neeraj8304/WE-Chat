# QA notes

## Verified in the managed preview

The initial authentication screen loads at the managed preview URL with no browser console errors. At a desktop viewport, the page renders the split editorial layout with the dark teal brand panel, responsive form card, email/password sign-in, and magic-link action. At a 390px mobile viewport, the brand panel collapses cleanly, the form remains readable, and the controls fit without horizontal overflow. Switching to **Create account** reveals the required name, city/country, email, and password fields.

Static quality checks also pass: `pnpm check`, `pnpm test`, and `pnpm build`. The test suite covers the Supabase credential health check, password sign-in delegation, profile upsert, conversation creation, message insertion, and read-receipt updates.

## Authenticated states covered in code

The implementation includes explicit loading, onboarding, schema/data error, empty inbox, empty contacts, empty thread, authenticated conversation, unread badge, and realtime message/read-receipt states. A real end-to-end authenticated browser pass requires a Supabase user session and the schema in `supabase/schema.sql` to be applied in the configured project. The preview remains intentionally unauthenticated and does not fabricate contacts or messages.

## Supabase setup required before live use

Run `supabase/schema.sql` in the Supabase SQL Editor, add the local and production origins to Supabase Auth redirect URLs, and then create or sign in with a real account. The app will surface a clear setup notice if the tables or RLS policies have not been applied.

## Google OAuth UI verification

The authentication screen was visually checked at desktop and mobile widths after adding **Continue with Google**. The button appears directly beneath the password action, remains readable at 390px width, preserves the magic-link action, and does not introduce horizontal overflow. The OAuth provider itself still requires the manual Google Cloud and Supabase setup documented in `docs/google-oauth.md` before a live redirect can be exercised.

## OAuth callback-error verification

The preview was opened with a simulated `error_description` callback parameter. Thoni displayed the user-facing message **“Google sign-in could not be completed: Google consent was cancelled”** while keeping the email, Google, and magic-link actions usable. Returning to the clean origin showed the normal auth screen without the error notice, confirming that the callback URL cleanup path is safe. A real Google round-trip remains dependent on enabling the provider and supplying Google OAuth credentials in Supabase.

## Thoni branding verification

The renamed **Thoni** wordmark, onboarding copy, browser title, and Google sign-in surface were checked at desktop and mobile widths. The desktop layout shows the new wordmark without disturbing the two-panel composition. The 390px mobile layout keeps the THONI label, Google button, magic-link action, and form controls readable without horizontal overflow.
