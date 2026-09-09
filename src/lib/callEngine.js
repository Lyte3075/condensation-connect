import { base44 } from "@/api/base44Client";

// Live call engine: a WebRTC mesh (audio, camera, screen share) whose signaling
// is relayed through the CallRoom actor. One active call per tab.

let listeners = new Set();
let room = null;
let sub = null;
let connId = null;
let channelId = null;
let mySeat = null;
let myRole = "speaker";
let meInfo = null;

let peers = new Map(); // seat -> { pc, polite, makingOffer, ignoreOffer, user, state, role, stream }
let micStream = null;
let micTrack = null;
let camStream = null;
let camTrack = null;
let shareStream = null;
let shareTrack = null;
let previewStream = null;

let status = "idle";
let mic = false;
let cam = false;
let share = false;
let deafen = false;
let hand = false;
let errorMsg = "";

const RTC_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function snapshot() {
  return {
    status,
    channelId,
    mic,
    cam,
    share,
    deafen,
    hand,
    error: errorMsg,
    mySeat,
    myRole,
    me: meInfo,
    participants: [...peers.values()].map((p) => ({
      seat: p.seat,
      user: p.user,
      state: p.state,
      role: p.role,
      stream: p.stream,
      connection: p.pc.connectionState,
    })),
  };
}

function emit() {
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function localPreview() {
  return previewStream;
}

function broadcastState() {
  if (room) room.send({ type: "state", s: { mic, cam, share, hand } });
  emit();
}

export async function join(channel, me, host) {
  if (channelId === channel.id) return;
  leave();
  const target = channel.id;
  channelId = target;
  meInfo = me;
  status = "connecting";
  errorMsg = "";
  emit();
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micTrack = micStream.getAudioTracks()[0] || null;
    mic = !!micTrack;
  } catch {
    mic = false;
    errorMsg = "No microphone access — you joined as a listener.";
  }
  if (channelId !== target) return; // navigated away while requesting the mic
  if (!connId) {
    connId = sessionStorage.getItem("cc-call-conn") || crypto.randomUUID();
    sessionStorage.setItem("cc-call-conn", connId);
  }
  room = base44.actors.CallRoom(channel.id).connect({ id: connId });
  sub = room.subscribe(onMessage);
  room.send({
    type: "join",
    user: { username: me.username, display: me.display, avatar: me.avatar },
    mic,
    host: !!host,
    stage: channel.type === "stage",
  });
  emit();
}

export function leave() {
  if (sub) {
    try {
      sub.unsubscribe();
    } catch {}
    sub = null;
  }
  if (room) {
    try {
      room.close();
    } catch {}
    room = null;
  }
  [micStream, camStream, shareStream].forEach((s) => s && s.getTracks().forEach((t) => t.stop()));
  micStream = camStream = shareStream = null;
  micTrack = camTrack = shareTrack = null;
  previewStream = null;
  peers.forEach((p) => {
    try {
      p.pc.close();
    } catch {}
  });
  peers = new Map();
  channelId = null;
  mySeat = null;
  myRole = "speaker";
  meInfo = null;
  status = "idle";
  mic = cam = share = hand = false;
  errorMsg = "";
  emit();
}

export function promote(seat, role) {
  if (room) room.send({ type: "promote", to: seat, role });
}

export function toggleDeafen() {
  deafen = !deafen;
  emit();
}

export function toggleHand() {
  hand = !hand;
  broadcastState();
}

export async function toggleMic() {
  if (!micTrack) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micTrack = micStream.getAudioTracks()[0];
      mic = true;
    } catch {
      errorMsg = "Microphone unavailable.";
      emit();
      return;
    }
    peers.forEach((p) => p.pc.addTrack(micTrack, micStream));
  } else {
    micTrack.enabled = !micTrack.enabled;
    mic = micTrack.enabled;
  }
  broadcastState();
}

function stopCam() {
  if (!camTrack) return;
  peers.forEach((p) => {
    const sender = p.pc.getSenders().find((s) => s.track === camTrack);
    if (sender) p.pc.removeTrack(sender);
  });
  camTrack.stop();
  camTrack = null;
  camStream = null;
  cam = false;
  rebuildPreview();
}

export async function toggleCam() {
  if (!camTrack) {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: false });
      camTrack = camStream.getVideoTracks()[0];
      cam = true;
    } catch {
      errorMsg = "Camera unavailable.";
      emit();
      return;
    }
    peers.forEach((p) => p.pc.addTrack(camTrack, camStream));
  } else {
    stopCam();
  }
  rebuildPreview();
  broadcastState();
}

function stopShare() {
  if (!shareTrack) return;
  peers.forEach((p) => {
    const sender = p.pc.getSenders().find((s) => s.track === shareTrack);
    if (sender) p.pc.removeTrack(sender);
  });
  shareTrack.onended = null;
  shareTrack.stop();
  shareTrack = null;
  shareStream = null;
  share = false;
  rebuildPreview();
}

export async function toggleShare() {
  if (!shareTrack) {
    try {
      shareStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      shareTrack = shareStream.getVideoTracks()[0];
      share = true;
      shareTrack.onended = () => {
        stopShare();
        broadcastState();
      };
    } catch {
      errorMsg = "Screen sharing was cancelled or unavailable.";
      emit();
      return;
    }
    peers.forEach((p) => p.pc.addTrack(shareTrack, shareStream));
  } else {
    stopShare();
  }
  rebuildPreview();
  broadcastState();
}

function rebuildPreview() {
  const tracks = [camTrack, shareTrack].filter(Boolean);
  previewStream = tracks.length ? new MediaStream(tracks) : null;
}

function addPeer(seat, info) {
  if (peers.has(seat)) return;
  const pc = new RTCPeerConnection(RTC_CONFIG);
  const p = {
    seat,
    pc,
    polite: mySeat != null && mySeat > seat,
    makingOffer: false,
    ignoreOffer: false,
    user: info.user || {},
    state: info.state || { mic: false, cam: false, share: false, hand: false },
    role: info.role || "speaker",
    stream: null,
  };
  peers.set(seat, p);
  if (micTrack) pc.addTrack(micTrack, micStream);
  if (camTrack) pc.addTrack(camTrack, camStream);
  if (shareTrack) pc.addTrack(shareTrack, shareStream);
  pc.onnegotiationneeded = async () => {
    try {
      p.makingOffer = true;
      await pc.setLocalDescription();
      if (room) room.send({ type: "signal", to: seat, data: pc.localDescription });
    } catch {
    } finally {
      p.makingOffer = false;
    }
  };
  pc.onicecandidate = ({ candidate }) => {
    if (candidate && room) room.send({ type: "signal", to: seat, data: { candidate } });
  };
  pc.ontrack = (e) => {
    p.stream = e.streams[0] || new MediaStream([e.track]);
    emit();
  };
  pc.onconnectionstatechange = () => emit();
  emit();
}

async function handleSignal(seat, data) {
  const p = peers.get(seat);
  if (!p || !data) return;
  const pc = p.pc;
  try {
    if (data.sdp) {
      const collision = data.type === "offer" && (p.makingOffer || pc.signalingState !== "stable");
      p.ignoreOffer = !p.polite && collision;
      if (p.ignoreOffer) return;
      await pc.setRemoteDescription(data);
      if (data.type === "offer") {
        await pc.setLocalDescription();
        if (room) room.send({ type: "signal", to: seat, data: pc.localDescription });
      }
    } else if (data.candidate) {
      try {
        await pc.addIceCandidate(data.candidate);
      } catch {}
    }
  } catch {
    // renegotiation races resolve themselves on the next offer
  }
}

function onMessage(msg) {
  if (!msg) return;
  if (msg.type === "welcome") {
    mySeat = msg.you;
    myRole = msg.role || "speaker";
    (msg.users || []).forEach((u) => addPeer(u.seat, u));
    status = "connected";
    emit();
  } else if (msg.type === "join") {
    addPeer(msg.peer.seat, msg.peer);
  } else if (msg.type === "presence") {
    const seats = new Set((msg.users || []).map((u) => u.seat));
    [...peers.keys()].forEach((s) => {
      if (!seats.has(s)) {
        try {
          peers.get(s).pc.close();
        } catch {}
        peers.delete(s);
      }
    });
    (msg.users || []).forEach((u) => {
      if (u.seat !== mySeat) addPeer(u.seat, u);
    });
    status = "connected";
    emit();
  } else if (msg.type === "leave") {
    const p = peers.get(msg.seat);
    if (p) {
      try {
        p.pc.close();
      } catch {}
      peers.delete(msg.seat);
      emit();
    }
  } else if (msg.type === "state") {
    const p = peers.get(msg.seat);
    if (p) {
      p.state = msg.s;
      emit();
    }
  } else if (msg.type === "role") {
    if (msg.seat === mySeat) {
      myRole = msg.role;
      if (myRole === "audience") {
        hand = false;
        if (cam || share) {
          stopCam();
          stopShare();
        }
      }
    } else {
      const p = peers.get(msg.seat);
      if (p) p.role = msg.role;
    }
    emit();
  } else if (msg.type === "signal") {
    handleSignal(msg.from, msg.data);
  } else if (msg.type === "full") {
    errorMsg = "This call is full.";
    leave();
  } else if (msg.type === "error") {
    errorMsg = msg.message || "Call error.";
    emit();
  }
}