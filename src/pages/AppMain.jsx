import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useAppearance } from "@/lib/useAppearance";
import { ensureStarterServer, createNotification, getMyProfile } from "@/lib/ccUtils";
import ServerRail from "@/components/cc/ServerRail";
import ChannelSidebar from "@/components/cc/ChannelSidebar";
import ChatView from "@/components/cc/ChatView";
import MemberList from "@/components/cc/MemberList";
import BottomTabs from "@/components/cc/BottomTabs";
import EditProfileModal from "@/components/cc/EditProfileModal";
import AppearanceModal from "@/components/cc/AppearanceModal";
import CreateServerModal from "@/components/cc/CreateServerModal";
import AddFriendModal from "@/components/cc/AddFriendModal";
import NewGroupModal from "@/components/cc/NewGroupModal";
import CallView from "@/components/cc/CallView";
import * as callEngine from "@/lib/callEngine";

export default function AppMain() {
  const { user, logout } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [servers, setServers] = useState([]);
  const [serverChannels, setServerChannels] = useState([]);
  const [dmChannels, setDmChannels] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showMembers, setShowMembers] = useState(() => window.innerWidth >= 768);
  const [modal, setModal] = useState(null);

  // Active server + channel live in the URL: /channels/:serverId?/:channelId?
  const view = !params.serverId || params.serverId === "dm" ? "dm" : params.serverId;
  const selectedChannelId = params.channelId || null;
  const mobilePanel = selectedChannelId ? "chat" : "sidebar";

  const userRef = useRef(user);
  const viewRef = useRef(view);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useAppearance(profile);

  const loadServers = useCallback(async () => {
    const all = await base44.entities.Server.list("-created_date", 200);
    setServers(all.filter((s) => s.member_ids?.includes(userRef.current.id)));
  }, []);

  const loadDmChannels = useCallback(async () => {
    const all = await base44.entities.Channel.list("-created_date", 500);
    setDmChannels(
      all.filter(
        (c) => (c.type === "dm" || c.type === "group") && c.member_ids?.includes(userRef.current.id)
      )
    );
  }, []);

  const loadFriendships = useCallback(async () => {
    const all = await base44.entities.Friendship.list("-created_date", 500);
    const uid = userRef.current.id;
    setFriends(all.filter((f) => f.status === "accepted" && (f.from_user_id === uid || f.to_user_id === uid)));
    setPending(all.filter((f) => f.status === "pending" && f.to_user_id === uid));
  }, []);

  const loadUnread = useCallback(async () => {
    const notifs = await base44.entities.Notification.filter({ user_id: userRef.current.id, read: false }, "-created_date", 100);
    setUnread(notifs.length);
  }, []);

  const loadServerChannels = useCallback(async (serverId) => {
    const ch = await base44.entities.Channel.filter({ server_id: serverId }, "created_date", 200);
    setServerChannels(ch);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setProfile(await getMyProfile(user));
      await ensureStarterServer(user);
      await Promise.all([loadServers(), loadDmChannels(), loadFriendships(), loadUnread()]);
      setBootstrapped(true);
    })();

    const unsubs = [];
    unsubs.push(base44.entities.Server.subscribe(() => loadServers()));
    unsubs.push(
      base44.entities.Channel.subscribe(() => {
        loadDmChannels();
        if (viewRef.current !== "dm") loadServerChannels(viewRef.current);
      })
    );
    unsubs.push(base44.entities.Friendship.subscribe(() => loadFriendships()));
    unsubs.push(base44.entities.Notification.subscribe(() => loadUnread()));
    return () => unsubs.forEach((u) => u && u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (view !== "dm") loadServerChannels(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const selectChannel = (chId) => navigate(`/channels/${view === "dm" ? "dm" : view}/${chId}`);
  const selectServer = (serverId) => navigate(`/channels/${serverId}`);
  const openDMs = () => navigate("/");
  const openDmChannel = (chId) => navigate(`/channels/dm/${chId}`);

  const getOrCreateDM = async (friendId, friendUsername) => {
    const existing = dmChannels.find(
      (c) =>
        c.type === "dm" &&
        c.member_ids?.length === 2 &&
        c.member_ids.includes(friendId) &&
        c.member_ids.includes(user.id)
    );
    if (existing) {
      openDmChannel(existing.id);
      return;
    }
    const ch = await base44.entities.Channel.create({
      server_id: "",
      name: friendUsername,
      type: "dm",
      member_ids: [user.id, friendId],
    });
    await loadDmChannels();
    openDmChannel(ch.id);
  };

  const sendFriendRequest = async (targetUsername) => {
    const target = (await base44.entities.Profile.filter({ username: targetUsername.toLowerCase() }, "-created_date", 1))[0];
    if (!target) throw new Error("No user with that username");
    if (target.user_id === user.id) throw new Error("That's you!");
    const already = [...friends, ...pending].some(
      (f) => f.from_user_id === target.user_id || f.to_user_id === target.user_id
    );
    if (already) throw new Error("Already friends or request pending");
    await base44.entities.Friendship.create({
      from_user_id: user.id,
      to_user_id: target.user_id,
      from_username: profile.username,
      to_username: target.username,
      status: "pending",
    });
    await createNotification({
      user_id: target.user_id,
      type: "friend_request",
      actor_username: profile.username,
      actor_avatar: profile.avatar_url,
      title: "New friend request",
      body: `@${profile.username} wants to be your friend`,
    });
    await loadFriendships();
  };

  const respondFriend = async (f, accept) => {
    if (accept) {
      await base44.entities.Friendship.update(f.id, { status: "accepted" });
      await createNotification({
        user_id: f.from_user_id,
        type: "friend_accept",
        actor_username: profile.username,
        actor_avatar: profile.avatar_url,
        title: "Friend request accepted",
        body: `@${profile.username} accepted your friend request`,
      });
    } else {
      await base44.entities.Friendship.delete(f.id);
    }
    await loadFriendships();
  };

  const createServer = async (name, icon, isPublic, description) => {
    const s = await base44.entities.Server.create({
      name,
      icon_url: icon || "",
      owner_id: user.id,
      member_ids: [user.id],
      is_starter: false,
      is_public: !!isPublic,
      description: description || "",
    });
    const ch = await base44.entities.Channel.create({
      server_id: s.id,
      name: "general",
      type: "text",
      member_ids: [],
    });
    await loadServers();
    navigate(`/channels/${s.id}/${ch.id}`);
  };

  const addChannel = async (name, type = "text") => {
    if (view === "dm") return;
    await base44.entities.Channel.create({
      server_id: view,
      name: type === "text" ? name.toLowerCase().replace(/\s+/g, "-") : name.trim(),
      type,
      member_ids: [],
    });
    await loadServerChannels(view);
  };

  const createGroup = async (name, memberIds) => {
    const ch = await base44.entities.Channel.create({
      server_id: "",
      name,
      type: "group",
      member_ids: [user.id, ...memberIds],
    });
    await loadDmChannels();
    openDmChannel(ch.id);
  };

  const updateProfile = async (data) => {
    if (data.username && data.username !== profile.username) {
      const taken = await base44.entities.Profile.filter({ username: data.username }, "-created_date", 1);
      if (taken.length) throw new Error("That username is taken — try another.");
    }
    const updated = await base44.entities.Profile.update(profile.id, data);
    if (data.username && data.username !== profile.username) {
      const allF = await base44.entities.Friendship.list("-created_date", 500);
      const uid = user.id;
      const mine = allF.filter((f) => f.from_user_id === uid || f.to_user_id === uid);
      await base44.entities.Friendship.bulkUpdate(
        mine.map((f) =>
          f.from_user_id === uid ? { id: f.id, from_username: data.username } : { id: f.id, to_username: data.username }
        )
      );
      const staleDms = dmChannels.filter((c) => c.type === "dm" && c.name === profile.username);
      await base44.entities.Channel.bulkUpdate(staleDms.map((c) => ({ id: c.id, name: data.username })));
      await Promise.all([loadFriendships(), loadDmChannels()]);
    }
    setProfile(updated);
  };

  const allChannels = view === "dm" ? dmChannels : serverChannels;
  const currentChannel = allChannels.find((c) => c.id === selectedChannelId);
  const activeServer = view !== "dm" ? servers.find((s) => s.id === view) : null;
  const isServerAdmin =
    !!activeServer && (activeServer.owner_id === user?.id || (activeServer.admin_ids || []).includes(user?.id));
  const memberIds = currentChannel
    ? currentChannel.type !== "dm" && currentChannel.type !== "group"
      ? [...new Set([...(activeServer?.member_ids || []), activeServer?.owner_id].filter(Boolean))]
      : currentChannel.member_ids || []
    : [];
  let chatTitle = "";
  let chatSubtitle = "";
  if (currentChannel) {
    if (currentChannel.type === "dm") {
      chatTitle = currentChannel.name;
      chatSubtitle = "Direct message";
    } else if (currentChannel.type === "group") {
      chatTitle = currentChannel.name;
      chatSubtitle = `${currentChannel.member_ids?.length || 0} members`;
    } else {
      chatTitle = currentChannel.name;
      chatSubtitle = currentChannel.topic || "Text channel";
    }
  }
  const canManageChannel = !!currentChannel && currentChannel.type === "text" && isServerAdmin;
  const canSend = !currentChannel || currentChannel.type !== "text" || !currentChannel.restricted || isServerAdmin;

  const isCall = !!currentChannel && (currentChannel.type === "voice" || currentChannel.type === "stage");
  const isCallHost =
    !!activeServer &&
    (activeServer.owner_id === user?.id ||
      (activeServer.admin_ids || []).includes(user?.id) ||
      (activeServer.moderator_ids || []).includes(user?.id));

  // Join the live call room while a voice/stage channel is open; leave on exit.
  useEffect(() => {
    if (!isCall || !profile || !user) {
      callEngine.leave();
      return;
    }
    callEngine.join(
      currentChannel,
      {
        id: user.id,
        username: profile.username,
        display: profile.display_name || profile.username,
        avatar: profile.avatar_url,
      },
      isCallHost
    );
    return () => callEngine.leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannel?.id, isCall, !!profile]);

  if (!bootstrapped || !profile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--cc-bg)]">
        <div className="w-8 h-8 border-4 border-[var(--cc-border)] border-t-[var(--cc-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] w-screen flex overflow-hidden bg-[var(--cc-bg)] text-[var(--cc-text)]"
      style={{ fontFamily: "var(--cc-font)" }}
    >
      <ServerRail
        servers={servers}
        view={view}
        onSelectServer={selectServer}
        onOpenDMs={openDMs}
        onAddServer={() => setModal("server")}
        profile={profile}
        onOpenSettings={() => setModal("profile")}
        onOpenAppearance={() => setModal("appearance")}
        onLogout={() => logout()}
        unreadCount={unread}
      />

      <div className={`${mobilePanel === "sidebar" ? "flex" : "hidden"} md:flex`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="w-60 md:w-64 flex-shrink-0 flex"
          >
            <ChannelSidebar
              mode={view === "dm" ? "dm" : "server"}
              server={view !== "dm" ? servers.find((s) => s.id === view) : null}
              channels={serverChannels}
              dmChannels={dmChannels}
              friends={friends}
              pending={pending}
              selectedChannelId={selectedChannelId}
              onSelectChannel={selectChannel}
              onCreateChannel={addChannel}
              onAddFriend={() => setModal("addfriend")}
              onNewGroup={() => setModal("group")}
              onOpenFriendDM={(f) => {
                const fid = f.from_user_id === user.id ? f.to_user_id : f.from_user_id;
                const fname = f.from_user_id === user.id ? f.to_username : f.from_username;
                getOrCreateDM(fid, fname);
              }}
              onAcceptFriend={(f) => respondFriend(f, true)}
              onDeclineFriend={(f) => respondFriend(f, false)}
              currentUserId={user.id}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={`${mobilePanel === "chat" ? "flex" : "hidden"} md:flex flex-1 min-w-0 relative`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedChannelId || "none"}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex min-w-0 h-full"
          >
            {currentChannel && isCall ? (
              <CallView
                channel={currentChannel}
                isHost={isCallHost}
                onBack={() => navigate(view === "dm" ? "/channels/dm" : `/channels/${view}`)}
                onToggleMembers={() => setShowMembers((v) => !v)}
              />
            ) : currentChannel ? (
              <ChatView
                channel={currentChannel}
                title={chatTitle}
                subtitle={chatSubtitle}
                me={{ id: user.id, username: profile.username, avatar: profile.avatar_url }}
                chatBg={profile.chat_bg}
                onBack={() => navigate(view === "dm" ? "/channels/dm" : `/channels/${view}`)}
                onToggleMembers={() => setShowMembers((v) => !v)}
                canManageChannel={canManageChannel}
                canSend={canSend}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[var(--cc-muted)]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--cc-accent)] text-black font-extrabold text-2xl flex items-center justify-center mx-auto mb-4">
                    CC
                  </div>
                  <p className="text-lg font-semibold text-[var(--cc-text)]">Condensation-Connect</p>
                  <p className="text-sm">Select a channel to start chatting</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {currentChannel && showMembers && (
          <MemberList memberIds={memberIds} server={activeServer} onClose={() => setShowMembers(false)} />
        )}
      </div>

      <BottomTabs />

      <EditProfileModal open={modal === "profile"} onClose={() => setModal(null)} profile={profile} onSave={updateProfile} />
      <AppearanceModal open={modal === "appearance"} onClose={() => setModal(null)} profile={profile} onSave={updateProfile} />
      <CreateServerModal open={modal === "server"} onClose={() => setModal(null)} onCreate={createServer} />
      <AddFriendModal open={modal === "addfriend"} onClose={() => setModal(null)} onSend={sendFriendRequest} />
      <NewGroupModal
        open={modal === "group"}
        onClose={() => setModal(null)}
        friends={friends}
        currentUserId={user.id}
        onCreate={createGroup}
      />
    </div>
  );
}