# Google sign-in setup for Thoni

The application now includes a **Continue with Google** button. It calls Supabase Auth with `provider: "google"` and redirects back to the current application origin. The button will remain unavailable for successful sign-in until the Google provider is enabled in the Supabase project.

## 1. Create the Google OAuth client

Open the [Google Auth Platform](https://console.cloud.google.com/auth/overview) for the Google Cloud project that will own Thoni’s OAuth consent screen. Configure the branding and consent screen, then open **Clients** and create an OAuth client of type **Web application**.

Use the following values:

| Google Cloud field            | Value                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorized JavaScript origins | The exact Thoni origin used by the browser, such as `http://localhost:3000` during local development and the final HTTPS site origin after publishing |
| Authorized redirect URI       | `https://hhogahentbnrijcweccm.supabase.co/auth/v1/callback`                                                                                           |

The redirect URI above is Supabase’s provider callback, not the Thoni page URL. Copy the generated **Client ID** and **Client Secret**; do not commit either value to the repository.

## 2. Enable Google in Supabase

Open the [Supabase Google provider settings](https://supabase.com/dashboard/project/hhogahentbnrijcweccm/auth/providers?provider=Google) for project `hhogahentbnrijcweccm`. Enable the Google provider, paste the Google **Client ID** and **Client Secret**, and save the provider configuration.

Then open [Supabase URL Configuration](https://supabase.com/dashboard/project/hhogahentbnrijcweccm/auth/url-configuration). Set the **Site URL** to the production Thoni origin once it is published. Add every origin that will be used by the app to the allowed redirect URL list. At minimum, include the local development origin and the production origin with a trailing slash, for example:

```text
http://localhost:3000/
https://your-production-domain.example/
```

For a temporary preview, add that exact preview origin as well. The app passes `window.location.origin + "/"` to `signInWithOAuth`, so the origin used in the browser must match an allowed Supabase redirect URL.

## 3. Test the flow

Open Thoni, select **Continue with Google**, choose a Google account, and confirm that Google returns to the Thoni origin. On the first successful Google login, the app will route to profile onboarding if the `profiles` row does not yet exist. Complete the name and city/country fields; the app then stores the profile through the existing RLS-protected upsert flow.

If Supabase reports a redirect error, compare the browser origin character-for-character with the Supabase allow list. If Google reports a redirect URI mismatch, confirm that the Google Cloud client contains the Supabase callback URL exactly as shown above.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase: Login with Google"
[2]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase: Redirect URLs"
[3]: https://console.cloud.google.com/auth/overview "Google Auth Platform"
