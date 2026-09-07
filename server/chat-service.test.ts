import { describe, expect, it, vi } from "vitest";
import {
  clearOAuthReturnUrl,
  findOrCreateConversation,
  formatGoogleOAuthError,
  getOAuthReturnError,
  markThreadRead,
  sendMessage,
  signInWithGoogle,
  signInWithPassword,
  upsertProfile,
} from "../client/src/lib/chat-service";
import type { ChatMessage, Profile } from "../client/src/lib/supabase";

function queryBuilder(result: unknown) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of [
    "select",
    "upsert",
    "insert",
    "update",
    "eq",
    "is",
    "contains",
    "limit",
  ]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.is.mockImplementation(() => Promise.resolve(result));
  return builder;
}

describe("chat Supabase service", () => {
  it("delegates password sign-in to Supabase Auth", async () => {
    const auth = {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "u-1" } } },
        error: null,
      }),
    };
    const result = await signInWithPassword(
      { auth },
      "asha@example.com",
      "secret123"
    );

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "asha@example.com",
      password: "secret123",
    });
    expect(result.data.session).toBeTruthy();
  });

  it("starts Google OAuth with the supplied callback URL", async () => {
    const auth = {
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com" },
        error: null,
      }),
    };
    const result = await signInWithGoogle(
      { auth },
      "https://thoni.example.com/"
    );

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://thoni.example.com/" },
    });
    expect(result.data.url).toContain("accounts.google.com");
  });

  it("formats disabled Google provider errors with setup guidance", () => {
    expect(
      formatGoogleOAuthError(new Error("Unsupported provider: google"))
    ).toContain("Enable Auth → Providers → Google");
    expect(formatGoogleOAuthError(new Error("Consent cancelled"))).toBe(
      "Consent cancelled"
    );
  });

  it("parses OAuth errors from callback fragments and query strings", () => {
    expect(
      getOAuthReturnError("https://thoni.example/#error=access_denied")
    ).toBe("access_denied");
    expect(
      getOAuthReturnError(
        "https://thoni.example/?error_description=Consent%20was%20cancelled"
      )
    ).toBe("Consent was cancelled");
    expect(getOAuthReturnError("https://thoni.example/")).toBeNull();
    expect(() => clearOAuthReturnUrl()).not.toThrow();
  });

  it("upserts a profile using the profile identity", async () => {
    const profile: Profile = {
      id: "u-1",
      email: "asha@example.com",
      name: "Asha Menon",
      location: "Kochi, India",
      created_at: "2026-09-01T00:00:00.000Z",
    };
    const profileQuery = queryBuilder({ data: profile, error: null });
    const client = { from: vi.fn().mockReturnValue(profileQuery) };

    const result = await upsertProfile(client, profile);

    expect(client.from).toHaveBeenCalledWith("profiles");
    expect(profileQuery.upsert).toHaveBeenCalledWith(profile, {
      onConflict: "id",
    });
    expect(result.data).toEqual(profile);
  });

  it("creates a conversation and sends a message with an unread receipt state", async () => {
    const profile: Profile = {
      id: "u-2",
      email: "dev@example.com",
      name: "Dev Rao",
      location: "Pune, India",
      created_at: "2026-09-01T00:00:00.000Z",
    };
    const conversationQuery = queryBuilder({ data: null, error: null });
    const insertConversationQuery = queryBuilder({
      data: {
        id: "c-1",
        user_ids: ["u-1", "u-2"],
        last_message: null,
        updated_at: "2026-09-01T00:00:00.000Z",
      },
      error: null,
    });
    const messageQuery = queryBuilder({
      data: {
        id: "m-1",
        sender_id: "u-1",
        receiver_id: "u-2",
        content: "Hello",
        created_at: "2026-09-01T00:00:00.000Z",
        read_at: null,
      } satisfies ChatMessage,
      error: null,
    });
    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce(conversationQuery)
        .mockReturnValueOnce(insertConversationQuery)
        .mockReturnValueOnce(messageQuery),
    };

    const conversation = await findOrCreateConversation(
      client,
      "u-1",
      "u-2",
      profile
    );
    const message = await sendMessage(client, {
      sender_id: "u-1",
      receiver_id: "u-2",
      content: "Hello",
    });

    expect(conversation.id).toBe("c-1");
    expect(conversation.otherProfile).toEqual(profile);
    expect(messageQuery.insert).toHaveBeenCalledWith({
      sender_id: "u-1",
      receiver_id: "u-2",
      content: "Hello",
      read_at: null,
    });
    expect(message.data?.read_at).toBeNull();
  });

  it("marks only unread messages in the active thread as read", async () => {
    const readQuery = queryBuilder({ data: null, error: null });
    const client = { from: vi.fn().mockReturnValue(readQuery) };

    await markThreadRead(client, "u-1", "u-2");

    expect(client.from).toHaveBeenCalledWith("messages");
    expect(readQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ read_at: expect.any(String) })
    );
    expect(readQuery.eq).toHaveBeenNthCalledWith(1, "sender_id", "u-2");
    expect(readQuery.eq).toHaveBeenNthCalledWith(2, "receiver_id", "u-1");
    expect(readQuery.is).toHaveBeenCalledWith("read_at", null);
  });
});
