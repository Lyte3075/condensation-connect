import { base44 } from "@/api/base44Client";

export const ACCENTS = [
  { id: "lime", value: "#CCFF00", fg: "#0a0a0a" },
  { id: "teal", value: "#10b981", fg: "#0a0a0a" },
  { id: "purple", value: "#8b5cf6", fg: "#ffffff" },
  { id: "cyan", value: "#06b6d4", fg: "#0a0a0a" },
  { id: "orange", value: "#f59e0b", fg: "#0a0a0a" },
  { id: "pink", value: "#ff4d6d", fg: "#ffffff" },
];

export const FONTS = [
  { id: "jakarta", name: "Jakarta Sans", stack: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { id: "outfit", name: "Outfit Display", stack: '"Outfit", system-ui, sans-serif' },
  { id: "playfair", name: "Playfair Serif", stack: '"Playfair Display", Georgia, serif' },
  { id: "jetbrains", name: "JetBrains Mono", stack: '"JetBrains Mono", ui-monospace, monospace' },
];

export const BACKGROUNDS = [
  { id: "none", name: "None", style: {} },
  {
    id: "lines",
    name: "Lines",
    style: {
      backgroundImage:
        "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04) 0, transparent 40%)",
    },
  },
  {
    id: "nebula",
    name: "Nebula",
    style: {
      background:
        "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.18), transparent 50%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.18), transparent 50%)",
    },
  },
  {
    id: "fluid",
    name: "Fluid",
    style: {
      background:
        "radial-gradient(circle at 25% 75%, rgba(16,185,129,0.18), transparent 50%), radial-gradient(circle at 75% 25%, rgba(132,204,22,0.14), transparent 50%)",
    },
  },
];

export function usernameToEmail(username) {
  const clean = (username || "").toLowerCase().replace(/[^a-z0-9_.]/g, "");
  return `${clean}@condensation.connect`;
}

export function isLightColor(hex) {
  const c = (hex || "#000").replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

export async function ensureStarterServer(user) {
  const existing = await base44.entities.Server.filter({ is_starter: true }, "-created_date", 1);
  let server = existing[0];
  if (!server) {
    server = await base44.entities.Server.create({
      name: "Condensation-Connect",
      icon_url: "",
      owner_id: user.id,
      member_ids: [user.id],
      is_starter: true,
    });
    const channels = await base44.entities.Channel.bulkCreate([
      { server_id: server.id, name: "welcome", type: "text", member_ids: [] },
      { server_id: server.id, name: "rules", type: "text", member_ids: [] },
      { server_id: server.id, name: "general", type: "text", member_ids: [] },
      { server_id: server.id, name: "introductions", type: "text", member_ids: [] },
    ]);
    const byName = (n) => channels.find((c) => c.name === n);
    const bot = { author_id: "condensation-bot", author_username: "Condensation", author_avatar: "" };
    await base44.entities.Message.bulkCreate([
      { channel_id: byName("welcome").id, ...bot, content: "👋 Welcome to Condensation-Connect! This is the starter server everyone joins — use it to learn the app and say hi." },
      { channel_id: byName("welcome").id, ...bot, content: "📍 Servers — Tap the + in the left rail to create your own server, or stay here to chat." },
      { channel_id: byName("welcome").id, ...bot, content: "💬 Direct Messages — Tap the chat-bubble icon for private DMs and group chats." },
      { channel_id: byName("welcome").id, ...bot, content: "👥 Friends — Search usernames to send friend requests, then message them directly." },
      { channel_id: byName("welcome").id, ...bot, content: "⚙️ Customize — Open the palette icon to change your accent color, theme, font, and chat background. Edit your profile with the avatar button." },
      { channel_id: byName("rules").id, ...bot, content: "1. Be kind and respectful.\n2. No spam.\n3. Have fun building community!" },
      { channel_id: byName("general").id, ...bot, content: "This is #general — the main chat. Say hello! 👋" },
    ]);
  } else if (!server.member_ids?.includes(user.id)) {
    await base44.entities.Server.update(server.id, {
      member_ids: [...(server.member_ids || []), user.id],
    });
  }
  return server;
}

export async function createNotification(data) {
  try {
    await base44.entities.Notification.create({ read: false, ...data });
  } catch (e) {
    // notifications are best-effort — never break the chat/friend/server flow
  }
}

export async function getMyProfile(user) {
  let prof = (await base44.entities.Profile.filter({ user_id: user.id }, "-created_date", 1))[0];
  if (!prof) {
    const username =
      ((user.email || "user").split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "") || "user").slice(0, 20);
    prof = await base44.entities.Profile.create({
      user_id: user.id,
      username,
      email: user.email,
      display_name: username,
      bio: "",
      status: "online",
      avatar_url: "",
      accent_color: "#CCFF00",
      theme_mode: "dark",
      font_family: "jakarta",
      chat_bg: "none",
    });
  } else if (!prof.email && user.email) {
    await base44.entities.Profile.update(prof.id, { email: user.email });
    prof = { ...prof, email: user.email };
  }
  return prof;
}

export async function loadFriendData(user) {
  const all = await base44.entities.Friendship.list("-created_date", 500);
  const uid = user.id;
  return {
    friends: all.filter((f) => f.status === "accepted" && (f.from_user_id === uid || f.to_user_id === uid)),
    incoming: all.filter((f) => f.status === "pending" && f.to_user_id === uid),
    outgoing: all.filter((f) => f.status === "pending" && f.from_user_id === uid),
  };
}