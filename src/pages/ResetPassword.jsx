import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const invalidLink = !resetToken;

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
          {invalidLink ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-bold text-white">Invalid reset link</h2>
              </div>
              <p className="text-sm text-[var(--cc-muted,#a0a0a0)] mb-5">
                This password reset link is missing or incomplete. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="block w-full h-12 rounded-lg bg-[var(--cc-accent,#CCFF00)] text-black font-semibold flex items-center justify-center"
              >
                Request a new link
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Choose a new password</h2>
              <p className="text-sm text-[var(--cc-muted,#a0a0a0)] mb-5">
                Enter a new password for your account below.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted,#a0a0a0)] mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoFocus
                    className="w-full h-11 px-3 rounded-lg bg-[var(--cc-input,#1e1e1e)] border border-[var(--cc-border,#2a2a2a)] text-white placeholder-[var(--cc-muted,#a0a0a0)] outline-none focus:border-[var(--cc-accent,#CCFF00)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted,#a0a0a0)] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full h-11 px-3 rounded-lg bg-[var(--cc-input,#1e1e1e)] border border-[var(--cc-border,#2a2a2a)] text-white placeholder-[var(--cc-muted,#a0a0a0)] outline-none focus:border-[var(--cc-accent,#CCFF00)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-[var(--cc-accent,#CCFF00)] text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-[var(--cc-muted,#a0a0a0)] mt-4">
          <Link to="/login" className="hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}