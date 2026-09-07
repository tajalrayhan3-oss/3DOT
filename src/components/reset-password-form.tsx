"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Opening your secure reset link…");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let recoveryReady = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) { recoveryReady = true; setReady(true); setMessage(""); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) { recoveryReady = true; setReady(true); setMessage(""); }
    });
    const timer = window.setTimeout(() => { if (!recoveryReady) setMessage("This reset link is invalid or has expired. Request a new link from the login page."); }, 4000);
    return () => { listener.subscription.unsubscribe(); window.clearTimeout(timer); };
  }, []);

  async function savePassword() {
    if (password.length < 6) return setMessage("Password must contain at least 6 characters.");
    if (password !== confirmPassword) return setMessage("Both passwords must match.");
    setLoading(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setMessage(error.message);
    setMessage("Password updated successfully. Opening your dashboard…");
    window.setTimeout(() => { window.location.href = "/dashboard"; }, 900);
  }

  return <div className="mt-8">
    <h1 className="text-3xl font-bold text-slate-950">Set a new password</h1>
    <p className="mt-2 text-sm text-slate-500">Enter a new password for your 3DOT account.</p>
    {ready && <><label className="mt-7 block text-sm font-semibold">New password</label><div className="relative mt-2"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} minLength={6} className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-violet-700"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="2"><path d="M2.3 12.1a1.9 1.9 0 0 1 0-1.8C3.3 8.2 6.8 4 12 4s8.7 4.2 9.7 6.3a1.9 1.9 0 0 1 0 1.8C20.7 15.2 17.2 19 12 19S3.3 15.2 2.3 12.1Z" /><circle cx="12" cy="11" r="3" /></svg></button></div><label className="mt-5 block text-sm font-semibold">Confirm new password</label><input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={showPassword ? "text" : "password"} minLength={6} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /><button type="button" onClick={savePassword} disabled={loading} className="mt-7 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Saving…" : "Save new password"}</button></>}
    {message && <p className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message}</p>}
  </div>;
}
