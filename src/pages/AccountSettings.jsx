import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppearance } from "@/lib/useAppearance";
import { getMyProfile } from "@/lib/ccUtils";
import PageShell from "@/components/cc/PageShell";
import Modal from "@/components/cc/Modal";
import { Mail, KeyRound, ShieldCheck, Loader2, Trash2, AlertTriangle } from "lucide-react";

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--cc-hover)] text-left"
    >
      <span
        className={`mt-0.5 w-10 h-6 rounded-full flex items-center px-1 transition-colors shrink-0 ${
          checked ? "bg-[var(--cc-accent)]" : "bg-[var(--cc-border)]"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-[var(--cc-muted)] mt-0.5">{description}</span>
      </span>
    </button>
  );
}

export default function AccountSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useAppearance(profile);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user).then(setProfile);
  }, [user]);

  if (!user || !profile) {
    return (
      <PageShell title="Account settings">
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  const setPref = async (key, value) => {
    const updated = await base44.entities.Profile.update(profile.id, { [key]: value });
    setProfile(updated);
  };

  const sendReset = async () => {
    setSending(true);
    try {
      await base44.auth.resetPasswordRequest(user.email);
    } catch {
      // Generic success either way
    }
    setSending(false);
    setSent(true);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const all = await base44.entities.Friendship.list("-created_date", 500);
      const mine = all.filter((f) => f.from_user_id === user.id || f.to_user_id === user.id);
      for (const f of mine) await base44.entities.Friendship.delete(f.id);
      await base44.entities.Profile.delete(profile.id);
      await base44.auth.logout("/login");
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <PageShell title="Account settings" subtitle="Login and security">
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-[var(--cc-accent)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Login email</h2>
          </div>
          <p className="text-sm break-all">{user.email}</p>
          <p className="text-xs text-[var(--cc-muted)] mt-2">
            Your login email is managed by the platform's sign-in service and can't be changed inside the app.
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-[var(--cc-accent)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Password</h2>
          </div>
          {sent ? (
            <p className="text-sm text-[var(--cc-muted)]">
              If an account exists for your email, a password reset link has been sent.
            </p>
          ) : (
            <>
              <p className="text-sm mb-3">We'll email you a link to set a new password.</p>
              <button
                onClick={sendReset}
                disabled={sending}
                className="px-4 py-2 rounded-lg bg-[var(--cc-accent)] text-black text-sm font-medium disabled:opacity-60 flex items-center gap-2"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Send reset link
              </button>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[var(--cc-accent)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Security preferences</h2>
          </div>
          <p className="text-xs text-[var(--cc-muted)] mb-2">Changes save instantly.</p>
          <div className="divide-y divide-[var(--cc-border)]">
            <Toggle
              checked={profile.allow_friend_requests !== false}
              onChange={(v) => setPref("allow_friend_requests", v)}
              label="Allow friend requests"
              description="Let other users find you and send you friend requests."
            />
            <Toggle
              checked={profile.allow_dms !== false}
              onChange={(v) => setPref("allow_dms", v)}
              label="Allow direct messages from non-friends"
              description="Friends can always message you directly."
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--cc-surface)] border border-red-500/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">Danger zone</h2>
          </div>
          <p className="text-sm text-[var(--cc-muted)] mb-3">
            Deleting your account wipes your profile, username, and friend connections from Condensation-Connect.
          </p>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium"
          >
            Delete account
          </button>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        subtitle="This permanently wipes your profile and can't be undone."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 text-sm text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              Your profile, bio, friends list, and preferences will be erased. You'll be signed out.
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 rounded-lg bg-[var(--cc-hover)] text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? "Deleting…" : "Yes, delete everything"}
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}