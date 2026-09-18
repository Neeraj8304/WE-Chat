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

## Google OAuth round-trip verification

The user confirmed that, after enabling the Google provider in Supabase, adding the Google client credentials, and allowing the Thoni preview origin, **Continue with Google** completed successfully. The account returned to Thoni, the profile onboarding flow completed, and the authenticated chat experience was available.

## Playful visual refresh verification

The Thoni authentication screen was checked at desktop and 390px mobile widths after the Linear-inspired refresh. The dark green hero now has soft mint glow, animated orbit lines, luminous branding, floating feature cards, and a brighter gradient primary action. The auth panel uses a pale green glass-like surface with mint-accented secondary actions. At mobile width, the updated controls remain readable, stacked, and touch-friendly without horizontal overflow.

## Phenomenon-inspired visual verification

The Thoni auth screen was checked at desktop and 390px mobile widths after adapting the user-provided Phenomenon Studio direction. The desktop view now uses an editorial black hero, oversized serif headline, thin orbit lines, warm paper form panel, and a high-contrast orange primary action. The mobile view preserves the same hierarchy, keeps the orange sign-in action prominent, and maintains readable touch targets without horizontal overflow.

## Reference-inspired accessibility checks

The orange primary action and warm panel maintain strong visual separation in the desktop and mobile screenshots. Explicit `:focus-visible` rings now use the orange accent with a three-pixel offset for keyboard users across buttons, inputs, textareas, and links. The orbit animation and hover transitions are disabled under `prefers-reduced-motion: reduce`, keeping the editorial motion language optional rather than required.

## Advanced Elyse-inspired visual verification

The refined auth experience was checked at 1280px desktop and 390px mobile widths. The desktop view preserves the high-contrast editorial split, adds a subtle grid texture, framed form corners, a stronger tab treatment, and a numbered metadata rule without crowding the login actions. The mobile view keeps the same luxury hierarchy, maintains readable headline wrapping, and preserves large touch targets for sign-in, Google, and magic-link actions.

## Recording diagnosis and current-build verification

The supplied recording shows an older or different Thoni build with a New conversation modal that accepts an email address or Profile link. Its visible failures are `user_not_found` for an email that is not registered in Thoni and `cannot_message_self` when the signed-in user pastes their own profile link. The current managed preview was opened with a cache-busting query and rendered the current `Thoni — conversations, considered` authentication screen with email/password, Google, and magic-link actions; the older conversation modal was absent. This confirms that those recording errors are expected validation responses from an older flow rather than evidence that the current auth screen is broken.
