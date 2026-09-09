import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppearance } from "@/lib/useAppearance";
import { getMyProfile } from "@/lib/ccUtils";
import PageShell from "@/components/cc/PageShell";
import NotificationItem from "@/components/cc/NotificationItem";
import { CheckCheck, Bell } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState(null);
  const [marking, setMarking] = useState(false);
  useAppearance(profile);

  const load = useCallback(async () => {
    const all = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 100);
    setItems(all);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getMyProfile(user).then(setProfile);
    load();
    const unsub = base44.entities.Notification.subscribe(() => load());
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unreadCount = (items || []).filter((n) => !n.read).length;

  const markAllRead = async () => {
    setMarking(true);
    try {
      await base44.entities.Notification.updateMany({ user_id: user.id, read: false }, { $set: { read: true } });
      await load();
    } finally {
      setMarking(false);
    }
  };

  const markRead = async (n) => {
    if (n.read) return;
    await base44.entities.Notification.update(n.id, { read: true });
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  };

  return (
    <PageShell title="Notifications" subtitle="Mentions, friend activity, and server alerts">
      {items && unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={markAllRead}
            disabled={marking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--cc-surface)] border border-[var(--cc-border)] text-xs font-medium text-[var(--cc-text)] hover:bg-[var(--cc-hover)] disabled:opacity-60"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read ({unreadCount})
          </button>
        </div>
      )}

      {items === null ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-[var(--cc-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--cc-muted)]">You're all caught up — nothing new yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NotificationItem key={n.id} n={n} onClick={markRead} />
          ))}
        </div>
      )}
    </PageShell>
  );
}