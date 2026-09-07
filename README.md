# Thoni

Thoni is a focused WhatsApp-style chat experience for private, everyday conversations. It includes email/password authentication, magic-link sign-in, profile onboarding, contact discovery, realtime conversations, timestamps, and read receipts.

## Stack

The app is built with React 19, TypeScript, Vite, Tailwind CSS 4, and the Supabase JavaScript client. Supabase provides Auth, PostgreSQL tables, Row Level Security, and Realtime subscriptions.

## Local setup

Install dependencies with `pnpm install`. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` through the project’s environment/secrets manager; never commit a `.env` file or a service-role key. Start the development server with `pnpm dev`, run the type check with `pnpm check`, and run the test suite with `pnpm test`.

Before signing in, open the Supabase SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql). In Supabase Auth URL Configuration, add the local and deployed app origins to the allowed redirect URLs so magic links can return to the app. Email confirmation behavior is controlled by the Supabase Auth provider settings.

## Data model

The schema creates `profiles`, `messages`, and `conversations` in the `public` schema. All three tables have Row Level Security enabled. Profiles are visible to authenticated users so contacts can be discovered. Messages are visible only to their sender or recipient, and conversations are visible only to members of the `user_ids` pair. Messages and conversations are added to the `supabase_realtime` publication.

## Deployment

For a Vercel or Netlify deployment, set the two Vite environment variables in the project settings and configure the production URL in Supabase Auth redirect settings. The project is also compatible with the managed hosting flow for this workspace; create a checkpoint first, then use the project’s Publish action. Exporting the project to a public GitHub repository can be done from the project management panel after review.

## Important production notes

The browser uses only the Supabase anonymous key, which is safe to expose when RLS policies are correctly configured. Do not put the Supabase service-role key in frontend code or Vite environment variables. If the schema has not been applied, the app intentionally shows a setup notice instead of silently faking contacts or messages.
