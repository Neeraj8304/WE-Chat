import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, Conversation, Profile } from "./supabase";

export type SupabaseAuthClient = Pick<SupabaseClient, "auth">;
export type SupabaseDataClient = Pick<SupabaseClient, "from">;

export function signInWithPassword(
  client: SupabaseAuthClient,
  email: string,
  password: string
) {
  return client.auth.signInWithPassword({ email, password });
}

export function signInWithGoogle(
  client: SupabaseAuthClient,
  redirectTo: string
) {
  return client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

export function getOAuthReturnError(url: string) {
  const parsed = new URL(url);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const query = parsed.searchParams;
  return (
    fragment.get("error_description") ||
    fragment.get("error") ||
    query.get("error_description") ||
    query.get("error")
  );
}

export function clearOAuthReturnUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState(
    {},
    document.title,
    `${window.location.pathname}${window.location.search}`
  );
}

export function upsertProfile(client: SupabaseDataClient, profile: Profile) {
  return client
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();
}

export async function findOrCreateConversation(
  client: SupabaseDataClient,
  currentUserId: string,
  otherUserId: string,
  otherProfile: Profile
) {
  const { data: existing, error: existingError } = await client
    .from("conversations")
    .select("id,user_ids,last_message,updated_at")
    .contains("user_ids", [currentUserId, otherUserId])
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { ...(existing as Conversation), otherProfile };

  const { data, error } = await client
    .from("conversations")
    .insert({
      user_ids: [currentUserId, otherUserId],
      last_message: null,
      updated_at: new Date().toISOString(),
    })
    .select("id,user_ids,last_message,updated_at")
    .single();
  if (error) throw error;
  return { ...(data as Conversation), otherProfile };
}

export function sendMessage(
  client: SupabaseDataClient,
  message: Omit<ChatMessage, "id" | "created_at" | "read_at">
) {
  return client
    .from("messages")
    .insert({ ...message, read_at: null })
    .select("id,sender_id,receiver_id,content,created_at,read_at")
    .single();
}

export function markThreadRead(
  client: SupabaseDataClient,
  currentUserId: string,
  otherUserId: string
) {
  return client
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherUserId)
    .eq("receiver_id", currentUserId)
    .is("read_at", null);
}
