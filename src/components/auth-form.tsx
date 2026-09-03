"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("3dot-has-account") === "true") setMode("signin");
  }, []);

  async function submit() {
    setLoading(true); setMessage("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/onboarding` } });
    setLoading(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signin") {
      window.localStorage.setItem("3dot-has-account", "true");
      window.location.href = "/dashboard";
    } else {
      window.localStorage.setItem("3dot-has-account", "true");
      setMessage("We sent a 6-digit code to your email.");
      setAwaitingCode(true);
    }
  }

  async function confirmCode() {
    setLoading(true); setMessage("");
    const { error } = await supabase.auth.verifyOtp({ email, token: verificationCode, type: "email" });
    setLoading(false);
    if (error) return setMessage(error.message);
    window.localStorage.setItem("3dot-has-account", "true");
    window.location.href = "/onboarding";
  }

  if (awaitingCode) return <div>
    <p className="mt-10 text-sm font-semibold">Enter the 6-digit code sent to {email}</p>
    <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-violet-500" />
    {message && <p className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">{message}</p>}
    <button onClick={confirmCode} disabled={loading || verificationCode.length !== 6} className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Checking code..." : "Verify code"}</button>
  </div>;

  return <div>
    <label className="mt-10 block text-sm font-semibold">Email address</label>
    <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.ae" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
    <label className="mt-5 block text-sm font-semibold">Password</label>
    <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} placeholder="At least 6 characters" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
    {message && <p className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">{message}</p>}
    <button onClick={submit} disabled={loading} className="mt-7 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
    <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="mt-5 w-full text-sm font-semibold text-violet-700">{mode === "signin" ? "New to 3DOT? Create an account" : "Already have an account? Sign in"}</button>
  </div>;
}
