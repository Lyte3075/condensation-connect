import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageShell from "@/components/cc/PageShell";
import moment from "moment";

const STATUS_META = {
  online: { label: "Online", color: "#22c55e" },
  idle: { label: "Idle", color: "#eab308" },
  dnd: { label: "Do Not Disturb", color: "#ef4444" },
  invisible: { label: "Invisible", color: "#6b7280" },
};

export default function UserProfilePage() {
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await base44.entities.Profile.get(id);
        if (active) setProfile(p);
      } catch {
        if (active) setNotFound(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (notFound) {
    return (
      <PageShell title="User profile">
        <div className="text-center text-[var(--cc-muted)] py-16">Profile not found.</div>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell title="User profile">
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  const name = profile.display_name || profile.username;
  const meta = STATUS_META[profile.status] || STATUS_META.online;

  return (
    <PageShell title={name} subtitle={`@${profile.username}`}>
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-4 border-[var(--cc-surface)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[var(--cc-accent)] text-black font-extrabold text-3xl flex items-center justify-center border-4 border-[var(--cc-surface)]">
              {(name || "?")[0]?.toUpperCase()}
            </div>
          )}
          <span
            className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[var(--cc-bg)]"
            style={{ backgroundColor: meta.color }}
            title={meta.label}
          />
        </div>
        <h1 className="text-xl font-bold mt-4">{name}</h1>
        <p className="text-sm text-[var(--cc-muted)]">@{profile.username}</p>
        <span
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
          {meta.label}
        </span>
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-2">About</h2>
        <p className="text-sm whitespace-pre-wrap break-words">
          {profile.bio?.trim() ? profile.bio : "No bio yet."}
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--cc-surface)] border border-[var(--cc-border)] p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)]">Member since</h2>
          <p className="text-sm mt-1">{moment(profile.created_date).format("MMMM YYYY")}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)]">Accent</h2>
          <span
            className="inline-block w-6 h-6 rounded-lg mt-1 border border-[var(--cc-border)]"
            style={{ backgroundColor: profile.accent_color || "#CCFF00" }}
          />
        </div>
      </div>
    </PageShell>
  );
}