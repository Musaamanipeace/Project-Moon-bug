import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Mail, KeyRound, ArrowRight, Sparkles, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Mode = "otp" | "password";

export default function Login() {
  const { requestOtp, verifyOtp, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";

  const [mode, setMode] = useState<Mode>("otp");
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = () => navigate(from, { replace: true });

  const sendOtp = async () => {
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp(email);
      setDevCode(res.devCode);
      setOtpSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(email, code);
      goHome();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async () => {
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        await signup(email, password, displayName || email.split("@")[0]);
      } else {
        await login(email, password);
      }
      goHome();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-6 flex max-w-md flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-full rounded-3xl p-7 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-glow/30 to-indigo-glow/20 ring-1 ring-violet-glow/40">
            <Moon className="h-6 w-6 text-moon" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-gradient">Enter Moonbug</h1>
          <p className="mt-1 text-sm text-moon-dim">Align your rhythm with the moon.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-violet-glow/15 bg-obsidian-soft/60 p-1 text-sm">
          {(["otp", "password"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setOtpSent(false);
              }}
              className={`relative rounded-full py-2 font-medium transition ${
                mode === m ? "text-white" : "text-moon-dim hover:text-moon"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-glow/40 to-indigo-glow/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-1.5">
                {m === "otp" ? <Mail className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                {m === "otp" ? "Magic code" : "Password"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "otp" ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="you@night.sky"
                value={email}
                onChange={setEmail}
                disabled={otpSent}
              />
              {!otpSent ? (
                <button
                  onClick={sendOtp}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-glow to-indigo-glow py-2.5 font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send magic code"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <Field
                    icon={<KeyRound className="h-4 w-4" />}
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={code}
                    onChange={setCode}
                  />
                  {devCode && (
                    <div className="flex items-center gap-2 rounded-xl border border-aurora/30 bg-aurora/10 px-3 py-2 text-sm text-aurora">
                      <Sparkles className="h-4 w-4" />
                      Preview code: <span className="font-mono font-semibold">{devCode}</span>
                    </div>
                  )}
                  <button
                    onClick={submitOtp}
                    disabled={busy || code.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-glow to-indigo-glow py-2.5 font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {busy ? "Verifying…" : "Enter Moonbug"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setCode("");
                      setDevCode(undefined);
                    }}
                    className="w-full text-center text-xs text-moon-dim hover:text-moon"
                  >
                    Use a different email
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="you@night.sky"
                value={email}
                onChange={setEmail}
              />
              {isSignup && (
                <Field
                  icon={<Sparkles className="h-4 w-4" />}
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={setDisplayName}
                />
              )}
              <Field
                icon={<KeyRound className="h-4 w-4" />}
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
              />
              <button
                onClick={submitPassword}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-glow to-indigo-glow py-2.5 font-medium text-white shadow-lg shadow-indigo-glow/30 transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? "Working…" : isSignup ? "Create account" : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsSignup((s) => !s);
                  setError(null);
                }}
                className="w-full text-center text-xs text-moon-dim hover:text-moon"
              >
                {isSignup ? "Have an account? Sign in" : "New here? Create an account"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-glow/30 bg-rose-glow/10 px-3 py-2 text-center text-sm text-rose-glow">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  inputMode,
}: {
  icon: ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-violet-glow/15 bg-obsidian-soft/60 px-3 focus-within:border-violet-glow/50">
      <span className="text-moon-dim">{icon}</span>
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-2.5 text-sm text-moon outline-none placeholder:text-moon-dim/60 disabled:opacity-60"
      />
    </div>
  );
}
