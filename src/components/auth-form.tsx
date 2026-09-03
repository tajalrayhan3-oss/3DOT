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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="mt-10">
      <h3 className="text-2xl font-bold text-slate-950">{mode === "signup" ? "Create your account" : "Sign in to 3DOT"}</h3>
      <p className="mt-1 text-sm text-slate-500">{mode === "signup" ? "Start managing your construction work in one place." : "Enter your details to continue to your workspace."}</p>
    </div>
    <label className="mt-7 block text-sm font-semibold">Email address</label>
    <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.ae" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
    <label className="mt-5 block text-sm font-semibold">Password</label>
    <div className="relative mt-2">
      <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} minLength={6} placeholder="At least 6 characters" className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
      <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-violet-700">
        {showPassword ? <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="2"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.7 10.7 0 0 1 12 4c5.2 0 8.7 4.2 9.7 6.1a1.9 1.9 0 0 1 0 1.8 18 18 0 0 1-3.2 4.1M6.6 6.6a18 18 0 0 0-4.3 3.5 1.9 1.9 0 0 0 0 1.8C3.3 13.8 6.8 18 12 18c.9 0 1.8-.1 2.6-.4" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="2"><path d="M2.3 12.1a1.9 1.9 0 0 1 0-1.8C3.3 8.2 6.8 4 12 4s8.7 4.2 9.7 6.3a1.9 1.9 0 0 1 0 1.8C20.7 15.2 17.2 19 12 19S3.3 15.2 2.3 12.1Z" /><circle cx="12" cy="11" r="3" /></svg>}
      </button>
    </div>
    {message && <p className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">{message}</p>}
    <button onClick={submit} disabled={loading} className="mt-7 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
    <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="mt-5 w-full text-sm font-semibold text-violet-700">{mode === "signin" ? "New to 3DOT? Create an account" : "Already have an account? Sign in"}</button>
  </div>;
}
