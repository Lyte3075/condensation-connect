import React from "react";
import { Link } from "react-router-dom";
import { Plus, Settings, LogOut, MessageCircle, Palette, Compass, Bell } from "lucide-react";

export default function ServerRail({
  servers,
  view,
  onSelectServer,
  onOpenDMs,
  onAddServer,
  profile,
  onOpenSettings,
  onOpenAppearance,
  onLogout,
  unreadCount = 0,
}) {
  const railBtn =
    "w-12 h-12 flex items-center justify-center transition-all duration-200 hover:rounded-xl";
  return (
    <div
      className="w-[68px] md:w-20 flex-shrink-0 bg-[var(--cc-rail)] flex flex-col items-center gap-2 cc-rail cc-clear-tabbar"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <button
        onClick={onOpenDMs}
        className={`${railBtn} rounded-2xl ${
          view === "dm"
            ? "bg-[var(--cc-accent)] text-black rounded-xl"
            : "bg-[var(--cc-surface)] text-[var(--cc-text)] hover:bg-[var(--cc-accent)] hover:text-black"
        }`}
        title="Direct Messages"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      <div className="w-8 h-px bg-[var(--cc-border)] my-1" />

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto items-center w-full px-2">
        {servers.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectServer(s.id)}
            className={`${railBtn} rounded-2xl relative ${
              view === s.id
                ? "bg-[var(--cc-accent)] text-black rounded-xl"
                : "bg-[var(--cc-surface)] text-[var(--cc-text)] hover:bg-[var(--cc-accent)] hover:text-black"
            }`}
            title={s.name}
          >
            {s.icon_url ? (
              <img src={s.icon_url} className="w-full h-full object-cover rounded-xl" alt="" />
            ) : (
              <span className="font-bold text-sm">{(s.name || "S").slice(0, 2).toUpperCase()}</span>
            )}
            {s.is_starter && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--cc-accent)] rounded-full border-2 border-[var(--cc-rail)]" />
            )}
          </button>
        ))}
        <button
          onClick={onAddServer}
          className={`${railBtn} rounded-2xl bg-[var(--cc-surface)] text-[var(--cc-accent)] hover:bg-[var(--cc-accent)] hover:text-black`}
          title="Add a server"
        >
          <Plus className="w-5 h-5" />
        </button>
        <Link
          to="/server-discovery"
          className={`${railBtn} rounded-2xl bg-[var(--cc-surface)] text-[var(--cc-muted)] hover:bg-[var(--cc-accent)] hover:text-black`}
          title="Discover public servers"
        >
          <Compass className="w-5 h-5" />
        </Link>
      </div>

      <div className="w-8 h-px bg-[var(--cc-border)] my-1" />

      <Link
        to="/notifications"
        className={`${railBtn} rounded-2xl relative bg-[var(--cc-surface)] text-[var(--cc-text)] hover:bg-[var(--cc-accent)] hover:text-black`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
      <Link
        to="/account-settings"
        className={`${railBtn} rounded-2xl bg-[var(--cc-surface)] text-[var(--cc-text)] hover:bg-[var(--cc-accent)] hover:text-black`}
        title="Account settings"
      >
        <Settings className="w-5 h-5" />
      </Link>
      <button
        onClick={onOpenAppearance}
        className={`${railBtn} rounded-2xl bg-[var(--cc-surface)] text-[var(--cc-text)] hover:bg-[var(--cc-accent)] hover:text-black`}
        title="Customize appearance"
      >
        <Palette className="w-5 h-5" />
      </button>
      <button
        onClick={onOpenSettings}
        className={`${railBtn} rounded-2xl overflow-hidden bg-[var(--cc-surface)] hover:rounded-xl`}
        title="Edit profile"
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--cc-text)]">
            {(profile.display_name || profile.username || "?")[0]?.toUpperCase()}
          </div>
        )}
      </button>
      <button
        onClick={onLogout}
        className={`${railBtn} rounded-2xl bg-[var(--cc-surface)] text-[var(--cc-muted)] hover:bg-red-500 hover:text-white`}
        title="Log out"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}