# QA notes

## Verified in the managed preview

The initial authentication screen loads at the managed preview URL with no browser console errors. At a desktop viewport, the page renders the split editorial layout with the dark teal brand panel, responsive form card, email/password sign-in, and magic-link action. At a 390px mobile viewport, the brand panel collapses cleanly, the form remains readable, and the controls fit without horizontal overflow. Switching to **Create account** reveals the required name, city/country, email, and password fields.

Static quality checks also pass: `pnpm check`, `pnpm test`, and `pnpm build`. The test suite covers the Supabase credential health check, password sign-in delegation, profile upsert, conversation creation, message insertion, and read-receipt updates.

## Authenticated states covered in code

The implementation includes explicit loading, onboarding, schema/data error, empty inbox, empty contacts, empty thread, authenticated conversation, unread badge, and realtime message/read-receipt states. A real end-to-end authenticated browser pass requires a Supabase user session and the schema in `supabase/schema.sql` to be applied in the configured project. The preview remains intentionally unauthenticated and does not fabricate contacts or messages.

## Supabase setup required before live use

Run `supabase/schema.sql` in the Supabase SQL Editor, add the local and production origins to Supabase Auth redirect URLs, and then create or sign in with a real account. The app will surface a clear setup notice if the tables or RLS policies have not been applied.
