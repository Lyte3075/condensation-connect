import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Hand,
  PhoneOff,
  Radio,
  UserPlus,
  UserMinus,
} from "lucide-react";
import * as callEngine from "@/lib/callEngine";
import CallTile from "@/components/cc/CallTile";

function Ctl({ on, Icon, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={!!on}
      className={`w-11 h-11 rounded-full flex items-center justify-center ${
        on
          ? "bg-[var(--cc-accent)] text-black"
          : "bg-[var(--cc-surface)] border border-[var(--cc-border)] text-[var(--cc-text)] hover:bg-[var(--cc-hover)]"
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default function CallView({ channel, isHost, onBack, onToggleMembers }) {
  const [call, setCall] = useState(null);
  useEffect(() => callEngine.subscribe(setCall), []);
  const c =
    call || {
      status: "connecting",
      participants: [],
      mic: false,
      cam: false,
      share: false,
      deafen: false,
      hand: false,
      myRole: "speaker",
      me: null,
      error: "",
    };
  const stage = channel.type === "stage";
  const HeaderIcon = stage ? Radio : Volume2;
  const myRole = c.myRole || "speaker";
  const canSpeak = !stage || myRole !== "audience";
  const speakers = stage ? c.participants.filter((p) => p.role !== "audience") : c.participants;
  const audience = stage ? c.participants.filter((p) => p.role === "audience") : [];
  const me = c.me || {};
  const selfUser = { username: me.username || "You", display: me.display || "You", avatar: me.avatar };

  const leaveCall = () => {
    callEngine.leave();
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <div className="min-h-14 cc-safe-top flex items-center gap-3 px-3 border-b border-[var(--cc-border)] bg-[var(--cc-sidebar)]">
        <button onClick={onBack} className="md:hidden text-[var(--cc-muted)] hover:text-[var(--cc-text)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <HeaderIcon className="w-5 h-5 text-[var(--cc-accent)] flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[var(--cc-text)] truncate">{channel.name}</div>
          <div className="text-xs text-[var(--cc-muted)] truncate">
            {c.status === "connecting"
              ? "Connecting…"
              : c.status === "connected"
                ? `${c.participants.length + 1} in call`
                : "Disconnected"}
          </div>
        </div>
        <button
          onClick={onToggleMembers}
          title="Toggle member list"
          className="p-1.5 text-[var(--cc-muted)] hover:text-[var(--cc-text)] hover:bg-[var(--cc-hover)] rounded-lg"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {c.error && (
          <div className="p-2.5 rounded-lg bg-[var(--cc-surface)] border border-[var(--cc-border)] text-xs text-[var(--cc-muted)]">
            {c.error}
          </div>
        )}

        {stage && <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)]">Speakers</div>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <CallTile
            user={selfUser}
            state={{ mic: c.mic, cam: c.cam, share: c.share, hand: c.hand }}
            role={myRole}
            stream={callEngine.localPreview()}
            showVideo={c.cam || c.share}
            muted
            isStage={stage}
          />
          {speakers.map((p) => (
            <CallTile
              key={p.seat}
              user={p.user}
              state={p.state}
              role={p.role}
              stream={p.stream}
              showVideo={p.state?.cam || p.state?.share}
              muted={c.deafen}
              isStage={stage}
              action={
                isHost && stage && p.role === "speaker" ? (
                  <button
                    onClick={() => callEngine.promote(p.seat, "audience")}
                    title="Move to audience"
                    className="p-1.5 rounded-lg bg-black/50 text-white text-[10px] font-medium flex items-center gap-1"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Audience
                  </button>
                ) : null
              }
            />
          ))}
        </div>

        {stage && audience.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
              Audience — {audience.length}
            </div>
            <div className="space-y-1.5">
              {audience.map((p) => (
                <div
                  key={p.seat}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[var(--cc-surface)] border border-[var(--cc-border)]"
                >
                  {p.user?.avatar ? (
                    <img src={p.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--cc-accent)] text-black font-bold flex items-center justify-center text-sm">
                      {(p.user?.display || p.user?.username || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-[var(--cc-text)] truncate flex-1">
                    {p.user?.display || p.user?.username}
                  </span>
                  {p.state?.hand && <Hand className="w-4 h-4 text-[var(--cc-accent)] flex-shrink-0" />}
                  {isHost && (
                    <button
                      onClick={() => callEngine.promote(p.seat, "speaker")}
                      className="px-2 py-1 rounded-lg bg-[var(--cc-hover)] text-xs font-medium text-[var(--cc-text)] flex items-center gap-1 flex-shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite to speak
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[var(--cc-border)] bg-[var(--cc-sidebar)] cc-clear-tabbar flex items-center justify-center gap-2 flex-wrap">
        {canSpeak && (
          <Ctl on={c.mic} Icon={c.mic ? Mic : MicOff} title="Microphone" onClick={() => callEngine.toggleMic()} />
        )}
        <Ctl
          on={!c.deafen}
          Icon={!c.deafen ? Volume2 : VolumeX}
          title="Deafen"
          onClick={() => callEngine.toggleDeafen()}
        />
        {canSpeak && <Ctl on={c.cam} Icon={c.cam ? Video : VideoOff} title="Camera" onClick={() => callEngine.toggleCam()} />}
        {canSpeak && (
          <Ctl
            on={c.share}
            Icon={c.share ? MonitorUp : MonitorOff}
            title="Share screen"
            onClick={() => callEngine.toggleShare()}
          />
        )}
        {stage && !canSpeak && <Ctl on={c.hand} Icon={Hand} title="Raise hand" onClick={() => callEngine.toggleHand()} />}
        <button
          onClick={leaveCall}
          title="Leave call"
          className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}