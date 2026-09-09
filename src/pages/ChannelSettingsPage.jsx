import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppearance } from "@/lib/useAppearance";
import { getMyProfile } from "@/lib/ccUtils";
import PageShell from "@/components/cc/PageShell";
import { Hash, Loader2, ShieldAlert } from "lucide-react";

function RestrictedToggle({ checked, onChange }) {
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
        <span className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">Restricted channel</span>
        <span className="block text-xs text-[var(--cc-muted)] mt-0.5">
          Only the server owner and admins can send messages here.
        </span>
      </span>
    </button>
  );
}

export default function ChannelSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [channel, setChannel] = useState(undefined); // undefined = still loading
  const [server, setServer] = useState(null);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useAppearance(profile);

  const channelId = new URLSearchParams(window.location.search).get("channel");

  useEffect(() => {
    if (!user || !channelId) return;
    let active = true;
    (async () => {
      const prof = await getMyProfile(user);
      if (!active) return;
      setProfile(prof);
      const ch = (await base44.entities.Channel.filter({ id: channelId }, "-created_date", 1))[0];
      if (!active) return;
      setChannel(ch || null);
      if (ch?.server_id) {
        const srv = (await base44.entities.Server.filter({ id: ch.server_id }, "-created_date", 1))[0];
        if (active) setServer(srv || null);
      } else {
        if (active) setServer(null);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, channelId]);

  useEffect(() => {
    if (channel) {
      setName(channel.name || "");
      setTopic(channel.topic || "");
      setRestricted(!!channel.restricted);
    }
  }, [channel]);

  if (!user || !profile || channel === undefined) {
    return (
      <PageShell title="Channel settings">
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!channel) {
    return (
      <PageShell title="Channel settings">
        <p className="text-sm text-[var(--cc-muted)] py-8 text-center">That channel could not be found.</p>
      </PageShell>
    );
  }

  const canManage =
    channel.type === "text" &&
    !!server &&
    (server.owner_id === user.id || (server.admin_ids || []).includes(user.id));

  if (!canManage) {
    return (
      <PageShell title="Channel settings">
        <div className="rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-6 text-center">
          <ShieldAlert className="w-8 h-8 text-[var(--cc-accent)] mx-auto mb-3" />
          <p className="text-sm text-[var(--cc-muted)]">
            Only the server owner or an admin can manage this channel.
          </p>
        </div>
      </PageShell>
    );
  }

  const save = async () => {
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleanName) {
      setError("Channel name can't be empty.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await base44.entities.Channel.update(channel.id, {
        name: cleanName,
        topic: topic.trim(),
        restricted,
      });
      setChannel(updated);
      setSaved(true);
    } catch (e) {
      setError(e?.message || "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="Channel settings" subtitle={`#${channel.name}`}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-[var(--cc-accent)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Overview</h2>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Channel name
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="channel-name"
            className="w-full h-11 px-3 mb-4 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-sm outline-none focus:border-[var(--cc-accent)]"
          />
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Channel topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setSaved(false);
            }}
            rows={3}
            maxLength={300}
            placeholder="What's this channel about?"
            className="w-full px-3 py-2 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-sm outline-none focus:border-[var(--cc-accent)] resize-none"
          />
        </div>

        <div className="rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-1">Access</h2>
          <p className="text-xs text-[var(--cc-muted)] mb-2">Changes apply when you press Save.</p>
          <RestrictedToggle
            checked={restricted}
            onChange={(v) => {
              setRestricted(v);
              setSaved(false);
            }}
          />
        </div>

        {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="px-5 py-2 rounded-lg bg-[var(--cc-accent)] text-black text-sm font-medium flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
          {saved && <span className="text-sm text-[var(--cc-accent)]">Saved ✓</span>}
        </div>
      </div>
    </PageShell>
  );
}