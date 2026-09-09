import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Modal from "@/components/cc/Modal";
import { Upload } from "lucide-react";

const STATUSES = [
  { id: "online", label: "Online", color: "#22c55e" },
  { id: "idle", label: "Idle", color: "#eab308" },
  { id: "dnd", label: "Do Not Disturb", color: "#ef4444" },
  { id: "invisible", label: "Invisible", color: "#6b7280" },
];

export default function EditProfileModal({ open, onClose, profile, onSave }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("online");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUsername(profile?.username || "");
      setDisplayName(profile?.display_name || "");
      setBio(profile?.bio || "");
      setStatus(profile?.status || "online");
      setAvatar(profile?.avatar_url || "");
    }
  }, [open, profile]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatar(file_url);
  };

  const save = async () => {
    setError("");
    const uname = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_.]{2,20}$/.test(uname)) {
      setError("Username must be 2-20 characters: letters, numbers, _ or .");
      return;
    }
    setSaving(true);
    try {
      await onSave({ username: uname, display_name: displayName, bio, status, avatar_url: avatar });
      onClose();
    } catch (err) {
      setError(err?.message || "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" subtitle="Update how others see you.">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--cc-accent)] text-black flex items-center justify-center font-bold text-xl">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" alt="" />
            ) : (
              (displayName || "?")[0]?.toUpperCase()
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[var(--cc-accent)] text-black text-sm font-medium flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Change avatar
            </button>
            <p className="text-xs text-[var(--cc-muted)] mt-1.5">PNG, JPG or WEBP. Max 5MB.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)]"
          />
          <p className="text-xs text-[var(--cc-muted)] mt-1.5">
            How friends find you. You still sign in with the username you registered with.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Display Name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[var(--cc-input)] border border-[var(--cc-border)] text-[var(--cc-text)] outline-none focus:border-[var(--cc-accent)] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted)] mb-1.5">
            Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                  status === s.id
                    ? "border-[var(--cc-accent)] bg-[var(--cc-hover)] text-[var(--cc-text)]"
                    : "border-[var(--cc-border)] text-[var(--cc-muted)]"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button onClick={onClose} className="text-sm text-[var(--cc-muted)] hover:text-[var(--cc-text)] px-3 py-2">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[var(--cc-accent)] text-black font-medium text-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}