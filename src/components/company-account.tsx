"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CompanyForm } from "@/components/company-form";
import { supabase } from "@/lib/supabase/client";

export function CompanyAccount() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    setEmail(user.email || "Signed-in user");
    setLoading(false);
  })(); }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Loading your company account…</main>;

  return <AppShell title="Company & account" description="Manage your company details, document branding and account access in one place.">
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Your company profile</p>
        <h2 className="mt-2 text-2xl font-bold">Company details & document branding</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">This is the company that signed up to 3DOT. Its details, logo, letterhead, signature and stamp appear on your quotations and invoices.</p>
        <CompanyForm redirectTo={null} />
      </section>
      <aside className="space-y-6">
        <section className="rounded-2xl bg-slate-950 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">3DOT account</p>
          <p className="mt-3 break-words text-sm font-semibold">{email}</p>
          <p className="mt-2 text-xs leading-5 text-white/65">You are signed in. Use this account to access your company workspace.</p>
          <button onClick={() => void signOut()} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">Log out</button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-bold">About 3DOT</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">3DOT keeps your clients, projects, team, timesheets, quotations and invoices together.</p>
          <div className="mt-4 space-y-2 text-sm font-semibold text-violet-700">
            <Link className="block" href="/clients">Manage clients →</Link>
            <Link className="block" href="/projects">Manage projects →</Link>
            <Link className="block" href="/quotations">View quotations →</Link>
            <Link className="block" href="/invoices">View invoices →</Link>
          </div>
        </section>
      </aside>
    </div>
  </AppShell>;
}
