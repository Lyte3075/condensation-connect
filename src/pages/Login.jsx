import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Zap, Loader2, MailCheck } from "lucide-react";

function postLoginPath() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return "/";
}

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

export default function Login({ initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mail = () => email.trim().toLowerCase();
  const uname = () => username.trim().toLowerCase();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "create") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail())) {
        setError("Enter a valid email address.");
        return;
      }
      if (!USERNAME_RE.test(uname())) {
        setError("Username must be 3–20 characters: letters, numbers, dots or underscores.");
        return;
      }
    } else if (!email.trim()) {
      setError("Enter your email or username.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "create" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        let loginEmail = mail();
        if (!email.trim().includes("@")) {
          const ident = email.trim().toLowerCase();
          const res = await base44.functions.invoke("getUsernameEmail", { username: ident });
          if (!res.data?.email) {
            setError("No account with that username.");
            return;
          }
          loginEmail = res.data.email;
        }
        await base44.auth.loginViaEmailPassword(loginEmail, password);
        window.location.href = postLoginPath();
        return;
      }
      // Creating an account: the username must be free before we register.
      const avail = await base44.functions.invoke("checkUsernameAvailability", { username: uname() });
      if (avail.data?.available === false) {
        setError("That username is taken — try another.");
        return;
      }
      await base44.auth.register({ email: mail(), password });
      setAwaitingOtp(true);
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) {
      setError("Enter the code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({ email: mail(), otpCode: otp.trim() });
      base44.auth.setToken(res?.access_token ?? res);
      // Save the profile with the chosen username now that we're signed in.
      try {
        const me = await base44.auth.me();
        const avail = await base44.functions.invoke("checkUsernameAvailability", { username: uname() });
        const finalUsername =
          avail.data?.available === false
            ? ((me.email || "user").split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "") || "user").slice(0, 20)
            : uname();
        await base44.entities.Profile.create({
          user_id: me.id,
          username: finalUsername,
          email: me.email,
          display_name: finalUsername,
          bio: "",
          status: "online",
          avatar_url: "",
          accent_color: "#CCFF00",
          theme_mode: "dark",
          font_family: "jakarta",
          chat_bg: "none",
        });
      } catch {
        // If saving the profile fails here, the app bootstrap will create one from the email.
      }
      window.location.href = postLoginPath();
    } catch (err) {
      setError(err?.message || "That code didn't work. Try again.");
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await base44.auth.resendOtp(mail());
    } catch {
      // best effort
    }
  };

  const inputCls =
    "w-full h-11 px-3 rounded-lg bg-[var(--cc-input,#1e1e1e)] border border-[var(--cc-border,#2a2a2a)] text-white placeholder-[var(--cc-muted,#a0a0a0)] outline-none focus:border-[var(--cc-accent,#CCFF00)]";

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
          {awaitingOtp ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <MailCheck className="w-5 h-5 text-[var(--cc-accent,#CCFF00)]" />
                <h2 className="text-xl font-bold text-white">Check your email</h2>
              </div>
              <p className="text-sm text-[var(--cc-muted,#a0a0a0)] mb-5">
                We sent a 6-digit code to <span className="text-white break-all">{mail()}</span>. Enter it below to
                finish creating your account.
              </p>

              {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

              <form onSubmit={verify} className="space-y-4">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full h-12 px-3 text-center tracking-[0.3em] rounded-lg bg-[var(--cc-input,#1e1e1e)] border border-[var(--cc-border,#2a2a2a)] text-white text-lg outline-none focus:border-[var(--cc-accent,#CCFF00)]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-[var(--cc-accent,#CCFF00)] text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify &amp; sign in <Zap className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
              <div className="flex items-center justify-between mt-4 text-xs">
                <button onClick={resend} className="text-[var(--cc-muted,#a0a0a0)] hover:underline">
                  Resend code
                </button>
                <button
                  onClick={() => {
                    setAwaitingOtp(false);
                    setOtp("");
                  }}
                  className="text-[var(--cc-muted,#a0a0a0)] hover:underline"
                >
                  Use a different email
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex bg-[var(--cc-bg,#121212)] rounded-full p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                    mode === "signin" ? "bg-[var(--cc-accent,#CCFF00)] text-black" : "text-[var(--cc-muted,#a0a0a0)]"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                    mode === "create" ? "bg-[var(--cc-accent,#CCFF00)] text-black" : "text-[var(--cc-muted,#a0a0a0)]"
                  }`}
                >
                  Create account
                </button>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">
                {mode === "signin" ? "Welcome back." : "Create your account."}
              </h2>
              <p className="text-sm text-[var(--cc-muted,#a0a0a0)] mb-5">
                {mode === "signin"
                  ? "Sign in with your email or username to jump back into your channels."
                  : "Pick a unique username and a real email — you'll confirm it with a quick code."}
              </p>

              {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

              <form onSubmit={submit} className="space-y-4">
                {mode === "create" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted,#a0a0a0)] mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="3–20 letters, numbers, . or _"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className={inputCls}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted,#a0a0a0)] mb-1.5">
                    {mode === "signin" ? "Email or username" : "Email"}
                  </label>
                  <input
                    type={mode === "signin" ? "text" : "email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === "signin" ? "you@example.com or your username" : "you@example.com"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted,#a0a0a0)] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputCls}
                  />
                </div>
                {mode === "signin" && (
                  <div className="text-right -mt-1">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[var(--cc-muted,#a0a0a0)] hover:underline hover:text-[var(--cc-accent,#CCFF00)]"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
                {mode === "create" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--cc-muted,#a0a0a0)] mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      className={inputCls}
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-[var(--cc-accent,#CCFF00)] text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "signin" ? "Sign in" : "Create account"}
                      <Zap className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-[var(--cc-muted,#a0a0a0)] mt-4">
          By continuing you agree to be kind to others.
        </p>
      </div>
    </div>
  );
}