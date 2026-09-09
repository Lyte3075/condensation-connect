import { Actor } from 'base44:runtime/actors';

// Signaling + roster room for one call (room id = channel id). Peers exchange
// SDP/ICE directly through here; media flows peer-to-peer over WebRTC.
const MAX_USERS = 32;

function sanitizeUser(u) {
  return {
    username: String(u?.username || 'user').slice(0, 30),
    display: String(u?.display || u?.username || 'user').slice(0, 40),
    avatar: typeof u?.avatar === 'string' && u.avatar.startsWith('http') ? u.avatar.slice(0, 300) : '',
  };
}

function sanitizeState(s) {
  return { mic: !!s?.mic, cam: !!s?.cam, share: !!s?.share, hand: !!s?.hand };
}

export default class CallRoom extends Actor {
  users = new Map(); // conn.id -> { seat, userId, user, state, role }
  nextSeat = 1;

  async handleStart() {
    const saved = await this.storage.get('users');
    if (saved) this.users = new Map(saved);
    const live = new Set(this.getConnections().map((c) => c.id));
    for (const id of this.users.keys()) if (!live.has(id)) this.users.delete(id);
    this.nextSeat = Math.max(0, ...[...this.users.values()].map((u) => u.seat)) + 1;
    await this.persist();
    this.broadcastPresence();
  }

  async handleConnect(conn) {
    // Admission happens on the client's 'join' message, where identity is verified.
  }

  async handleMessage(conn, msg) {
    if (typeof msg !== 'object' || msg === null) return;
    if (msg.type === 'join') return this.handleJoin(conn, msg);
    const me = this.users.get(conn.id);
    if (!me) return;
    if (msg.type === 'state') {
      me.state = sanitizeState({ ...me.state, ...msg.s });
      await this.persist();
      this.broadcast({ type: 'state', seat: me.seat, s: me.state });
    } else if (msg.type === 'signal' && msg.data) {
      const target = this.connForSeat(msg.to);
      if (target) target.send({ type: 'signal', from: me.seat, data: msg.data });
    } else if (msg.type === 'promote' && me.role === 'host') {
      const entry = this.entryForSeat(msg.to);
      if (entry && entry.part.role !== 'host') {
        entry.part.role = msg.role === 'speaker' ? 'speaker' : 'audience';
        await this.persist();
        this.broadcast({ type: 'role', seat: entry.part.seat, role: entry.part.role });
      }
    }
  }

  async handleJoin(conn, msg) {
    if (this.users.has(conn.id)) return; // reconnect reclaims its entry
    const identity = conn.identity;
    if (!identity || identity.type !== 'authenticated') {
      conn.send({ type: 'error', message: 'Sign in to join calls' });
      return;
    }
    if (this.users.size >= MAX_USERS) {
      conn.send({ type: 'full' });
      return;
    }
    const part = {
      seat: this.nextSeat++,
      userId: identity.userId,
      user: sanitizeUser(msg.user),
      state: sanitizeState({ mic: msg.mic !== false }),
      role: msg.host ? 'host' : msg.stage ? 'audience' : 'speaker',
    };
    this.users.set(conn.id, part);
    await this.persist();
    conn.send({
      type: 'welcome',
      you: part.seat,
      role: part.role,
      users: this.roster().filter((u) => u.seat !== part.seat),
    });
    this.broadcastExcept(conn.id, {
      type: 'join',
      peer: { seat: part.seat, user: part.user, state: part.state, role: part.role },
    });
  }

  async handleClose(conn) {
    const part = this.users.get(conn.id);
    if (!part) return;
    this.users.delete(conn.id);
    await this.persist();
    this.broadcast({ type: 'leave', seat: part.seat });
  }

  roster() {
    return [...this.users.values()].map((p) => ({ seat: p.seat, user: p.user, state: p.state, role: p.role }));
  }
  entryForSeat(seat) {
    for (const [id, p] of this.users) if (p.seat === seat) return { id, part: p };
    return null;
  }
  connForSeat(seat) {
    const e = this.entryForSeat(seat);
    if (!e) return null;
    return this.getConnections().find((c) => c.id === e.id) || null;
  }
  broadcastExcept(connId, msg) {
    for (const c of this.getConnections()) if (c.id !== connId) c.send(msg);
  }
  broadcastPresence() {
    this.broadcast({ type: 'presence', users: this.roster() });
  }
  async persist() {
    await this.storage.put('users', [...this.users.entries()]);
  }
}