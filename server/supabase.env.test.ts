import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("accepts the configured browser credentials", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    expect(url).toMatch(/^https:\/\//);
    expect(anonKey).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
