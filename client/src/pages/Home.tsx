import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  Globe2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import {
  supabase,
  type ChatMessage,
  type Conversation,
  type Profile,
} from "@/lib/supabase";
import {
  clearOAuthReturnUrl,
  findOrCreateConversation,
  getOAuthReturnError,
  markThreadRead,
  sendMessage,
  signInWithGoogle,
} from "@/lib/chat-service";

type AuthMode = "signin" | "signup";
type AppView = "inbox" | "contacts";

type Notice = {
  tone: "success" | "error" | "info";
  text: string;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatListTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatClock(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function Avatar({
  profile,
  size = "md",
}: {
  profile: Pick<Profile, "name">;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-xl",
  };
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-[#cde3dc] font-semibold text-[#0f6b5f] ${sizes[size]}`}
      aria-hidden="true"
    >
      {initials(profile.name)}
    </div>
  );
}

function NoticeBanner({
  notice,
  onDismiss,
}: {
  notice: Notice;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        notice.tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : notice.tone === "success"
            ? "border-[#b8ddd2] bg-[#eff9f5] text-[#0f6b5f]"
            : "border-[#d9d4ca] bg-[#f8f6f1] text-[#5f625d]"
      }`}
      role="status"
    >
      <span className="flex-1">{notice.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="opacity-70 transition hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AuthLanding({
  onAuthenticated,
  initialNotice,
}: {
  onAuthenticated: (session: Session) => void;
  initialNotice?: Notice | null;
}) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(initialNotice ?? null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim(), location: location.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          onAuthenticated(data.session);
        } else {
          setNotice({
            tone: "success",
            text: "Your account is ready. Check your inbox to confirm your email, then come back to sign in.",
          });
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) onAuthenticated(data.session);
      }
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "We could not complete that request.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    setNotice(null);
    const { error } = await signInWithGoogle(
      supabase,
      `${window.location.origin}/`
    );
    if (error) {
      setBusy(false);
      setNotice({ tone: "error", text: error.message });
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setNotice({
        tone: "error",
        text: "Enter your email first and we’ll send a secure sign-in link.",
      });
      return;
    }
    setBusy(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    setNotice(
      error
        ? { tone: "error", text: error.message }
        : {
            tone: "success",
            text: "Magic link sent. Check your inbox to continue.",
          }
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f0ea] px-4 py-5 text-[#17201d] sm:px-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1400px] overflow-hidden rounded-[2rem] border border-[#ded8cd] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(27,44,38,0.10)] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative hidden overflow-hidden bg-[#123f38] p-10 text-[#f5f3ea] lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-20 top-12 h-72 w-72 rounded-full border border-[#9ac2b8]/30" />
          <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-[#9ac2b8]/20" />
          <div className="relative z-10 flex items-center gap-3 text-sm font-medium tracking-[0.18em] text-[#c9e3db] uppercase">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d7efe8] text-[#123f38]">
              <MessageCircle className="h-5 w-5" />
            </span>
            Arattai
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-5 flex items-center gap-2 text-sm font-medium text-[#a9d2c8]">
              <Sparkles className="h-4 w-4" /> conversations, considered
            </p>
            <h1 className="max-w-[650px] text-5xl font-semibold leading-[1.03] tracking-[-0.045em] xl:text-7xl">
              A calmer place to stay close.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#c4ddd6]">
              Private, personal messaging for the people and ideas you want
              within reach. No noise. Just the thread that matters.
            </p>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <ShieldCheck className="mb-8 h-5 w-5 text-[#a9d2c8]" />
                <p className="text-sm font-medium">Private by default</p>
                <p className="mt-1 text-xs leading-5 text-[#a9c5bd]">
                  Your conversations are protected by row-level access rules.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <Globe2 className="mb-8 h-5 w-5 text-[#a9d2c8]" />
                <p className="text-sm font-medium">People, not profiles</p>
                <p className="mt-1 text-xs leading-5 text-[#a9c5bd]">
                  Find your circle by name and location, then start talking.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs text-[#a9c5bd]">
            <LockKeyhole className="h-4 w-4" /> End-to-end ready conversations
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="mb-7 flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-[#123f38] uppercase">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d7efe8]">
                  <MessageCircle className="h-5 w-5" />
                </span>{" "}
                Arattai
              </div>
              <p className="text-sm font-medium text-[#0f6b5f]">
                Conversations, considered.
              </p>
            </div>
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-[#8d938e] uppercase">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#17201d]">
                {mode === "signin"
                  ? "Pick up where you left off."
                  : "Make room for better conversations."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#737a75]">
                {mode === "signin"
                  ? "Sign in to your quiet corner of the internet."
                  : "A few details, then you’re ready to find your people."}
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#f0eee8] p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setNotice(null);
                }}
                className={`rounded-lg px-4 py-2.5 transition ${mode === "signin" ? "bg-white text-[#123f38] shadow-sm" : "text-[#7b817d] hover:text-[#42524d]"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setNotice(null);
                }}
                className={`rounded-lg px-4 py-2.5 transition ${mode === "signup" ? "bg-white text-[#123f38] shadow-sm" : "text-[#7b817d] hover:text-[#42524d]"}`}
              >
                Create account
              </button>
            </div>

            {notice && (
              <div className="mb-5">
                <NoticeBanner
                  notice={notice}
                  onDismiss={() => setNotice(null)}
                />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[#626b65]">
                      Your name
                    </span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa19b]" />
                      <input
                        required
                        value={name}
                        onChange={event => setName(event.target.value)}
                        placeholder="e.g. Asha Menon"
                        className="h-12 w-full rounded-xl border border-[#dedbd3] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#afb4af] focus:border-[#6aa89b] focus:ring-4 focus:ring-[#d8ece6]"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[#626b65]">
                      City / country
                    </span>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa19b]" />
                      <input
                        required
                        value={location}
                        onChange={event => setLocation(event.target.value)}
                        placeholder="e.g. Kochi, India"
                        className="h-12 w-full rounded-xl border border-[#dedbd3] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#afb4af] focus:border-[#6aa89b] focus:ring-4 focus:ring-[#d8ece6]"
                      />
                    </div>
                  </label>
                </>
              )}
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-[#626b65]">
                  Email address
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa19b]" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-[#dedbd3] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#afb4af] focus:border-[#6aa89b] focus:ring-4 focus:ring-[#d8ece6]"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-[#626b65]">
                  Password
                </span>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="h-12 w-full rounded-xl border border-[#dedbd3] bg-white px-4 text-sm outline-none transition placeholder:text-[#afb4af] focus:border-[#6aa89b] focus:ring-4 focus:ring-[#d8ece6]"
                />
              </label>
              <button
                disabled={busy}
                type="submit"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123f38] px-5 text-sm font-semibold text-white transition hover:bg-[#0d332e] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
              >
                {busy
                  ? "One moment…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create my account"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
            <button
              type="button"
              disabled={busy}
              onClick={handleGoogleSignIn}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d9d6ce] bg-white px-5 text-sm font-semibold text-[#38514a] transition hover:border-[#a3c8bd] hover:bg-[#f8fbf9] disabled:cursor-wait disabled:opacity-60"
            >
              <Globe2 className="h-4 w-4" /> Continue with Google
            </button>
            <div className="my-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.14em] text-[#a1a6a1] uppercase">
              <span className="h-px flex-1 bg-[#e8e4dc]" /> or{" "}
              <span className="h-px flex-1 bg-[#e8e4dc]" />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleMagicLink}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d9d6ce] bg-white px-5 text-sm font-semibold text-[#38514a] transition hover:border-[#a3c8bd] hover:bg-[#f8fbf9] disabled:opacity-60"
            >
              <Mail className="h-4 w-4" /> Send a magic link
            </button>
            <p className="mt-6 text-center text-xs leading-5 text-[#9a9e99]">
              By continuing, you agree to keep Arattai a respectful space for
              real conversations.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileOnboarding({
  session,
  onComplete,
  onLogout,
}: {
  session: Session;
  onComplete: (profile: Profile) => void;
  onLogout: () => void;
}) {
  const metadata = session.user.user_metadata as {
    name?: string;
    location?: string;
  };
  const [name, setName] = useState(metadata.name ?? "");
  const [location, setLocation] = useState(metadata.location ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const profile = {
      id: session.user.id,
      email: session.user.email ?? "",
      name: name.trim(),
      location: location.trim(),
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "id" })
      .select()
      .single();
    setBusy(false);
    if (error)
      setNotice({
        tone: "error",
        text: `${error.message}. If this is a new Supabase project, apply the included schema first.`,
      });
    else onComplete(data as Profile);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f0ea] px-4 py-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#ded8cd] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(27,44,38,0.10)] md:grid md:grid-cols-[0.85fr_1.15fr]">
        <div className="bg-[#123f38] p-8 text-[#f5f3ea] sm:p-12">
          <div className="mb-20 flex items-center gap-3 text-sm font-medium tracking-[0.18em] text-[#c9e3db] uppercase">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d7efe8] text-[#123f38]">
              <MessageCircle className="h-5 w-5" />
            </span>{" "}
            Arattai
          </div>
          <p className="mb-4 text-sm text-[#a9d2c8]">
            One last thoughtful detail
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
            Help people know it’s you.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#c4ddd6]">
            Your name and location make it easier for your circle to find the
            right you. You can change these later.
          </p>
        </div>
        <div className="p-8 sm:p-12">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#8d938e] uppercase">
                Your profile
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#17201d]">
                Welcome in.
              </h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#d7efe8] text-sm font-semibold text-[#0f6b5f]">
              {initials(name || session.user.email || "?")}
            </div>
          </div>
          {notice && (
            <div className="mb-5">
              <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#626b65]">
                Name
              </span>
              <input
                required
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Your display name"
                className="h-13 w-full rounded-xl border border-[#dedbd3] bg-white px-4 text-sm outline-none transition placeholder:text-[#afb4af] focus:border-[#6aa89b] focus:ring-4 focus:ring-[#d8ece6]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#626b65]">
                City / country
              </span>
              <input
                required
                value={location}
                onChange={event => setLocation(event.target.value)}
                placeholder="Where are you based?"
                className="h-13 w-full rounded-xl border border-[#dedbd3] bg-white px-4 text-sm outline-none transition placeholder:text-[#afb4af] focus:border-[#6aa89b] focus:ring-4 focus:ring-[#d8ece6]"
              />
            </label>
            <div className="rounded-2xl bg-[#f2f6f3] p-4 text-sm leading-6 text-[#5e6b65]">
              <LockKeyhole className="mb-3 h-4 w-4 text-[#0f6b5f]" />
              Only signed-in people can see profile details and conversations.
            </div>
            <button
              disabled={busy}
              type="submit"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123f38] px-5 text-sm font-semibold text-white transition hover:bg-[#0d332e] active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "Saving your profile…" : "Enter Arattai"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
          <button
            type="button"
            onClick={onLogout}
            className="mt-5 flex items-center gap-2 text-sm font-medium text-[#7f8781] transition hover:text-[#123f38]"
          >
            <ArrowLeft className="h-4 w-4" /> Use a different account
          </button>
        </div>
      </div>
    </main>
  );
}

function EmptyInbox({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[1.5rem] bg-[#e3f0ec] text-[#0f6b5f]">
          <MessageCircle className="h-7 w-7" />
        </div>
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#8d938e] uppercase">
          Your inbox is clear
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#1f2925]">
          Start with a hello.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#7c837e]">
          Choose someone from your contacts and make the first move. Good
          conversations usually start small.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#123f38] px-5 text-sm font-semibold text-white transition hover:bg-[#0d332e]"
        >
          <MessageSquarePlus className="h-4 w-4" /> New conversation
        </button>
      </div>
    </div>
  );
}

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNew,
}: {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onNew: () => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-[#e7e3dc] bg-[#fbfaf7]">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#8d938e] uppercase">
            Messages
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1c2722]">
            Inbox
          </h1>
        </div>
        <button
          type="button"
          onClick={onNew}
          aria-label="New conversation"
          className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3f0ec] text-[#0f6b5f] transition hover:bg-[#cde3dc]"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a8a3]" />
          <input
            placeholder="Search conversations"
            className="h-10 w-full rounded-xl border border-[#e4e0d8] bg-[#f6f4ef] pl-10 pr-3 text-sm outline-none transition placeholder:text-[#a7aca7] focus:border-[#a3c8bd] focus:ring-4 focus:ring-[#e4f0ed]"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {conversations.length === 0 ? (
          <div className="mx-2 rounded-2xl border border-dashed border-[#dedbd3] p-5 text-center">
            <p className="text-sm font-medium text-[#53615a]">
              No conversations yet
            </p>
            <p className="mt-1 text-xs leading-5 text-[#929892]">
              Your next good chat belongs here.
            </p>
            <button
              type="button"
              onClick={onNew}
              className="mt-4 text-xs font-semibold text-[#0f6b5f] hover:underline"
            >
              Find someone
            </button>
          </div>
        ) : (
          conversations.map(conversation =>
            conversation.otherProfile ? (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selectedId === conversation.id ? "bg-[#e7f1ed]" : "hover:bg-[#f3f2ed]"}`}
              >
                <Avatar profile={conversation.otherProfile} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[#29342f]">
                      {conversation.otherProfile.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] text-[#9aa19b]">
                        {formatListTime(conversation.updated_at)}
                      </span>
                      {!!conversation.unreadCount && (
                        <span
                          className="grid min-w-5 place-items-center rounded-full bg-[#0f6b5f] px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          aria-label={`${conversation.unreadCount} unread messages`}
                        >
                          {conversation.unreadCount > 9
                            ? "9+"
                            : conversation.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#8a918b]">
                    {conversation.last_message || "New conversation"}
                  </span>
                </span>
              </button>
            ) : null
          )
        )}
      </div>
    </aside>
  );
}

function ContactsPanel({
  profiles,
  conversations,
  onSelect,
  selectedId,
  onBack,
}: {
  profiles: Profile[];
  conversations: Conversation[];
  onSelect: (profile: Profile) => void;
  selectedId?: string;
  onBack?: () => void;
}) {
  const conversationIds = useMemo(
    () =>
      new Set(
        conversations.flatMap(conversation =>
          conversation.otherProfile ? [conversation.otherProfile.id] : []
        )
      ),
    [conversations]
  );
  return (
    <section className="flex min-h-0 flex-col bg-[#fbfaf7]">
      <div className="flex items-center gap-3 border-b border-[#e7e3dc] px-5 py-5">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-xl text-[#66736c] hover:bg-[#f0eee8] xl:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#8d938e] uppercase">
            People
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1c2722]">
            Contacts
          </h2>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {profiles.length === 0 ? (
          <div className="grid h-full place-items-center">
            <div className="max-w-xs text-center">
              <UsersRound className="mx-auto mb-4 h-8 w-8 text-[#b4beb8]" />
              <p className="text-sm font-medium text-[#53615a]">
                No other people yet
              </p>
              <p className="mt-2 text-xs leading-5 text-[#929892]">
                Once someone joins your space, they’ll appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {profiles.map(profile => (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile)}
                className={`flex items-center gap-3 rounded-2xl p-3 text-left transition ${selectedId === profile.id ? "bg-[#e7f1ed]" : "hover:bg-[#f3f2ed]"}`}
              >
                <Avatar profile={profile} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#29342f]">
                    {profile.name}
                  </span>
                  <span className="mt-1 flex items-center gap-1 truncate text-xs text-[#8a918b]">
                    <MapPin className="h-3 w-3" />{" "}
                    {profile.location || "Location not shared"}
                  </span>
                </span>
                {conversationIds.has(profile.id) && (
                  <Check className="h-4 w-4 text-[#0f6b5f]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ChatThread({
  currentUserId,
  profile,
  conversation,
  onBack,
  onConversationCreated,
}: {
  currentUserId: string;
  profile: Profile;
  conversation?: Conversation;
  onBack: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(Boolean(conversation));
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let active = true;
    if (!conversation) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotice(null);
    supabase
      .from("messages")
      .select("id,sender_id,receiver_id,content,created_at,read_at")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error)
          setNotice({
            tone: "error",
            text: `${error.message}. Apply the included Supabase schema if these tables are not set up yet.`,
          });
        setMessages((data as ChatMessage[] | null) ?? []);
        setLoading(false);
      });
    void markThreadRead(supabase, currentUserId, profile.id);
    const channel = supabase
      .channel(`arattai-messages-${currentUserId}-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        payload => {
          const message = payload.new as ChatMessage;
          const belongs =
            (message.sender_id === currentUserId &&
              message.receiver_id === profile.id) ||
            (message.sender_id === profile.id &&
              message.receiver_id === currentUserId);
          if (!belongs) return;
          setMessages(current => {
            const existing = current.findIndex(item => item.id === message.id);
            if (payload.eventType === "UPDATE" && existing >= 0) {
              return current.map(item =>
                item.id === message.id ? message : item
              );
            }
            if (existing >= 0) return current;
            if (
              payload.eventType === "INSERT" &&
              message.sender_id === profile.id
            ) {
              void markThreadRead(supabase, currentUserId, profile.id);
            }
            return [...current, message];
          });
        }
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [conversation, currentUserId, profile.id]);

  async function ensureConversation() {
    if (conversation) return conversation;
    const created = await findOrCreateConversation(
      supabase,
      currentUserId,
      profile.id,
      profile
    );
    onConversationCreated(created);
    return created;
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const activeConversation = await ensureConversation();
      const { data, error } = await sendMessage(supabase, {
        sender_id: currentUserId,
        receiver_id: profile.id,
        content,
      });
      if (error) throw error;
      setMessages(current =>
        current.some(item => item.id === data.id)
          ? current
          : [...current, data as ChatMessage]
      );
      setDraft("");
      await supabase
        .from("conversations")
        .update({ last_message: content, updated_at: new Date().toISOString() })
        .eq("id", activeConversation.id);
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "We could not send that message.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#f7f5f0]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#e5e1d9] bg-[#fbfaf7] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-xl text-[#66736c] hover:bg-[#f0eee8] xl:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Avatar profile={profile} />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[#25322c]">
              {profile.name}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#869089]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6fb19f]" />{" "}
              {profile.location || "Available to chat"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#7b8780]">
          <button
            type="button"
            aria-label="Start video call"
            className="hidden h-9 w-9 place-items-center rounded-xl hover:bg-[#f0eee8] sm:grid"
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Start audio call"
            className="hidden h-9 w-9 place-items-center rounded-xl hover:bg-[#f0eee8] sm:grid"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="More conversation options"
            className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[#f0eee8]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
        {notice && (
          <div className="mx-auto mb-4 w-full max-w-3xl">
            <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
          </div>
        )}
        {loading ? (
          <div className="grid flex-1 place-items-center text-sm text-[#8c948d]">
            Loading your conversation…
          </div>
        ) : messages.length === 0 ? (
          <div className="grid flex-1 place-items-center">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e3f0ec] text-[#0f6b5f]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#8d938e] uppercase">
                A fresh thread
              </p>
              <p className="mt-2 text-sm leading-6 text-[#7c837e]">
                Say hello to {profile.name.split(" ")[0]} and make this space
                yours.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {messages.map(message => {
              const own = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${own ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[min(84%,32rem)] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${own ? "rounded-br-md bg-[#cfe8df] text-[#183d35]" : "rounded-bl-md border border-[#e3dfd7] bg-white text-[#3e4843]"}`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div
                      className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${own ? "text-[#4c8475]" : "text-[#a0a6a0]"}`}
                    >
                      <span>{formatClock(message.created_at)}</span>
                      {own &&
                        (message.read_at ? (
                          <CheckCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-[#e5e1d9] bg-[#fbfaf7] p-3 sm:p-4"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#ddd9d1] bg-white p-2 shadow-sm">
          <button
            type="button"
            aria-label="Attach a file"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#829087] hover:bg-[#f1f2ee]"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            placeholder={`Write to ${profile.name.split(" ")[0]}…`}
            className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-sm text-[#24312b] outline-none placeholder:text-[#a4aaa4]"
          />
          <button
            type="button"
            aria-label="Add an emoji"
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl text-[#829087] hover:bg-[#f1f2ee] sm:grid"
          >
            <SmilePlus className="h-4 w-4" />
          </button>
          <button
            disabled={!draft.trim() || sending}
            type="submit"
            aria-label="Send message"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#123f38] text-white transition hover:bg-[#0d332e] disabled:cursor-not-allowed disabled:bg-[#d4ddd8]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}

function AccountRail({
  profile,
  onLogout,
  onContacts,
}: {
  profile: Profile;
  onLogout: () => void;
  onContacts: () => void;
}) {
  return (
    <aside className="hidden flex-col border-l border-[#e7e3dc] bg-[#fbfaf7] p-5 xl:flex">
      <div className="mb-7 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#8d938e] uppercase">
          Your space
        </p>
        <button
          type="button"
          aria-label="Account options"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#8b948d] hover:bg-[#f0eee8]"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="rounded-3xl bg-[#123f38] p-5 text-[#f6f4ea]">
        <Avatar profile={profile} size="lg" />
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
          {profile.name}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#b9d8cf]">
          <MapPin className="h-3 w-3" />{" "}
          {profile.location || "Location not shared"}
        </p>
        <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-[#b9d8cf]">
          Your conversations are yours. Arattai keeps this space simple,
          private, and easy to return to.
        </div>
      </div>
      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={onContacts}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#65716b] transition hover:bg-[#f1f2ee] hover:text-[#123f38]"
        >
          <UsersRound className="h-4 w-4" /> Browse contacts
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#65716b] transition hover:bg-[#fdf0ec] hover:text-[#a34c3c]"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

function ChatApp({
  session,
  profile,
  onLogout,
}: {
  session: Session;
  profile: Profile;
  onLogout: () => void;
}) {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<
    Conversation | undefined
  >();
  const [view, setView] = useState<AppView>("inbox");
  const [dataError, setDataError] = useState<string | null>(null);

  async function loadData() {
    setDataError(null);
    const [
      { data: contactData, error: contactError },
      { data: conversationData, error: conversationError },
      { data: unreadData, error: unreadError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,name,location,created_at")
        .neq("id", session.user.id)
        .order("name"),
      supabase
        .from("conversations")
        .select("id,user_ids,last_message,updated_at")
        .contains("user_ids", [session.user.id])
        .order("updated_at", { ascending: false }),
      supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", session.user.id)
        .is("read_at", null),
    ]);
    if (contactError || conversationError || unreadError) {
      setDataError(
        `${contactError?.message || conversationError?.message || unreadError?.message}. Apply the included Supabase schema to enable the inbox.`
      );
      return;
    }
    const profiles = (contactData as Profile[]) ?? [];
    const profileMap = new Map(profiles.map(item => [item.id, item]));
    const unreadBySender = new Map<string, number>();
    for (const row of unreadData ?? []) {
      unreadBySender.set(
        row.sender_id,
        (unreadBySender.get(row.sender_id) ?? 0) + 1
      );
    }
    const hydrated = ((conversationData as Conversation[]) ?? [])
      .map(conversation => {
        const otherId =
          conversation.user_ids.find(id => id !== session.user.id) ?? "";
        return {
          ...conversation,
          otherProfile: profileMap.get(otherId),
          unreadCount: unreadBySender.get(otherId) ?? 0,
        };
      })
      .filter(conversation => conversation.otherProfile);
    setContacts(profiles);
    setConversations(hydrated);
  }

  useEffect(() => {
    void loadData();
  }, [session.user.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`arattai-updates-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        payload => {
          const message = payload.new as Partial<ChatMessage>;
          if (
            message.sender_id === session.user.id ||
            message.receiver_id === session.user.id
          ) {
            void loadData();
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session.user.id]);

  function selectConversation(conversation: Conversation) {
    if (!conversation.otherProfile) return;
    setSelectedConversation({ ...conversation, unreadCount: 0 });
    setSelectedProfile(conversation.otherProfile);
    setConversations(current =>
      current.map(item =>
        item.id === conversation.id ? { ...item, unreadCount: 0 } : item
      )
    );
    void markThreadRead(
      supabase,
      session.user.id,
      conversation.otherProfile.id
    );
    setView("inbox");
  }

  function selectContact(contact: Profile) {
    const existing = conversations.find(
      conversation => conversation.otherProfile?.id === contact.id
    );
    setSelectedConversation(
      existing ? { ...existing, unreadCount: 0 } : undefined
    );
    setSelectedProfile(contact);
    if (existing) {
      setConversations(current =>
        current.map(item =>
          item.id === existing.id ? { ...item, unreadCount: 0 } : item
        )
      );
      void markThreadRead(supabase, session.user.id, contact.id);
    }
    setView("inbox");
  }

  function handleConversationCreated(conversation: Conversation) {
    setSelectedConversation(conversation);
    setConversations(current => [
      conversation,
      ...current.filter(item => item.id !== conversation.id),
    ]);
  }

  return (
    <main className="min-h-screen bg-[#f4f0ea] p-0 text-[#17201d] sm:p-3 lg:p-5">
      <div className="mx-auto flex h-[100dvh] max-w-[1600px] flex-col overflow-hidden border border-[#ded8cd] bg-[#fbfaf7] shadow-[0_20px_60px_rgba(27,44,38,0.08)] sm:h-[calc(100dvh-1.5rem)] sm:rounded-[1.5rem] lg:h-[calc(100dvh-2.5rem)]">
        {dataError && (
          <div className="shrink-0 border-b border-red-100 bg-red-50 px-5 py-3 text-center text-xs text-red-700">
            {dataError}
          </div>
        )}
        <div className="flex min-h-0 flex-1 md:grid md:grid-cols-[304px_minmax(0,1fr)] xl:grid-cols-[304px_minmax(0,1fr)_300px]">
          <div
            className={`${view === "contacts" ? "hidden md:flex" : "flex"} min-h-0`}
          >
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id}
              onSelect={selectConversation}
              onNew={() => setView("contacts")}
            />
          </div>
          <div
            className={`${view === "contacts" || selectedProfile ? "flex" : "hidden md:flex"} min-h-0 flex-1`}
          >
            {view === "contacts" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <ContactsPanel
                  profiles={contacts}
                  conversations={conversations}
                  selectedId={selectedProfile?.id}
                  onSelect={selectContact}
                  onBack={() => setView("inbox")}
                />
              </div>
            ) : selectedProfile ? (
              <ChatThread
                currentUserId={session.user.id}
                profile={selectedProfile}
                conversation={selectedConversation}
                onBack={() => {
                  setSelectedProfile(null);
                  setSelectedConversation(undefined);
                }}
                onConversationCreated={handleConversationCreated}
              />
            ) : (
              <EmptyInbox onStart={() => setView("contacts")} />
            )}
          </div>
          <AccountRail
            profile={profile}
            onLogout={onLogout}
            onContacts={() => setView("contacts")}
          />
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-[#e7e3dc] bg-[#fbfaf7] px-5 py-2.5 md:hidden">
          <button
            type="button"
            onClick={() => setView("inbox")}
            className={`flex flex-1 flex-col items-center gap-1 text-[10px] font-semibold ${view === "inbox" ? "text-[#0f6b5f]" : "text-[#9aa19b]"}`}
          >
            <Menu className="h-4 w-4" /> Inbox
          </button>
          <button
            type="button"
            onClick={() => setView("contacts")}
            className={`flex flex-1 flex-col items-center gap-1 text-[10px] font-semibold ${view === "contacts" ? "text-[#0f6b5f]" : "text-[#9aa19b]"}`}
          >
            <UsersRound className="h-4 w-4" /> People
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex flex-1 flex-col items-center gap-1 text-[10px] font-semibold text-[#9aa19b]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [oauthNotice, setOauthNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const oauthError = getOAuthReturnError(window.location.href);
    if (oauthError) {
      setOauthNotice({
        tone: "error",
        text: `Google sign-in could not be completed: ${oauthError}`,
      });
      clearOAuthReturnUrl();
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setAuthReady(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession)
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("id,email,name,location,created_at")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data as Profile | null);
      });
    return () => {
      active = false;
    };
  }, [session]);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (!authReady)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f0ea] text-sm text-[#7b837d]">
        Opening your space…
      </div>
    );
  if (!session)
    return (
      <AuthLanding onAuthenticated={setSession} initialNotice={oauthNotice} />
    );
  if (!profile)
    return (
      <ProfileOnboarding
        session={session}
        onComplete={setProfile}
        onLogout={logout}
      />
    );
  return <ChatApp session={session} profile={profile} onLogout={logout} />;
}
