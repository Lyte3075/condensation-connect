import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return;
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(mail);
    } catch {
      // Always show generic success, whether or not the account exists
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--cc-bg,#121212)] px-4"
      style={{ fontFamily: "var(--cc-font)" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--cc-accent,#CCFF00)] text-black font-extrabold text-2xl mb-4">
            CC
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Condensation-Connect</h1>
        </div>

        <div className="bg-[var(--cc-surface,#1a1a1a)] rounded-2xl border border-[var(--cc-border,#2a2a2a)] p-6">
          <h2 className="text-xl font-bold text-white mb-1">Reset your password</h2>
          <p className="text-sm text-[var(--cc-muted,#a0a0a0)] mb-5">
            Enter the email you signed up with and we'll send you a reset link.
          </p>

          {sent ? (
            <p className="text-sm text-[var(--cc-muted,#a0a0a0)] text-center py-4">
              If an account exists with that email, you'll receive a password reset link shortly.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted,#a0a0a0)] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full h-11 px-3 rounded-lg bg-[var(--cc-input,#1e1e1e)] border border-[var(--cc-border,#2a2a2a)] text-white placeholder-[var(--cc-muted,#a0a0a0)] outline-none focus:border-[var(--cc-accent,#CCFF00)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-12 rounded-lg bg-[var(--cc-accent,#CCFF00)] text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send reset link"}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-[var(--cc-muted,#a0a0a0)] mt-4">
          <Link to="/login" className="hover:underline">
            <ArrowLeft className="w-3 h-3 inline mr-1" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}