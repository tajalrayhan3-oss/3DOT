"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CompanyForm } from "@/components/company-form";
import { supabase } from "@/lib/supabase/client";

type Company = { name: string; trn: string | null; city: string | null; email: string | null; phone: string | null; address: string | null; website: string | null; logo_url: string | null; letterhead_url: string | null; signature_url: string | null; stamp_url: string | null; document_footer: string | null };

export function CompanyAccount() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    setEmail(user.email || "Signed-in user");
    const { data } = await supabase.from("companies").select("name,trn,city,email,phone,address,website,logo_url,letterhead_url,signature_url,stamp_url,document_footer").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setCompany(data as Company | null);
    setLoading(false);
  })(); }, []);

  async function signOut() { await supabase.auth.signOut(); window.location.href = "/login"; }
  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Loading your company account…</main>;
  const details = [["TRN / VAT number", company?.trn], ["City", company?.city], ["Company email", company?.email], ["Phone", company?.phone], ["Website", company?.website], ["Address", company?.address]];

  return <AppShell title="Company & account" description="Your saved company details, document branding and account access.">
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        {!company || editing ? <><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">{company ? "Edit company profile" : "Company setup"}</p><h2 className="mt-2 text-2xl font-bold">{company ? "Update your saved company details" : "Set up your company"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Your logo, letterhead, signature and stamp will be used on quotations and invoices.</p><CompanyForm redirectTo="/company" /></> : <><div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-4">{company.logo_url && <img src={company.logo_url} alt={`${company.name} logo`} className="h-16 w-16 rounded-xl border border-slate-200 object-contain p-1" />}<div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Saved company profile</p><h2 className="mt-1 text-2xl font-bold">{company.name}</h2><p className="mt-1 text-sm text-slate-500">This company is shown on your documents.</p></div></div><span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Saved</span></div><div className="mt-7 grid gap-5 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className={label === "Address" ? "sm:col-span-2" : ""}><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 whitespace-pre-line text-sm font-medium text-slate-800">{value || "Not added"}</p></div>)}</div><div className="mt-8 grid gap-4 sm:grid-cols-2">{company.letterhead_url && <a href={company.letterhead_url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-violet-700">View saved letterhead →</a>}{company.signature_url && <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Saved signature</p><img src={company.signature_url} alt="Saved signature" className="mt-3 h-12 max-w-40 object-contain" /></div>}{company.stamp_url && <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Saved company stamp</p><img src={company.stamp_url} alt="Saved company stamp" className="mt-3 h-16 w-16 object-contain" /></div>}</div>{company.document_footer && <div className="mt-7 border-t border-slate-200 pt-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Quotation & invoice footer</p><p className="mt-2 text-sm leading-6 text-slate-600">{company.document_footer}</p></div>}<button onClick={() => setEditing(true)} className="mt-10 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Edit company profile</button></>}
      </section>
      <aside className="space-y-6"><section className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">3DOT account</p><p className="mt-3 break-words text-sm font-semibold">{email}</p><p className="mt-2 text-xs leading-5 text-white/65">You are signed in to this company workspace.</p><button onClick={() => void signOut()} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">Log out</button></section><section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold">About 3DOT</p><p className="mt-2 text-sm leading-6 text-slate-500">3DOT keeps your clients, projects, team, timesheets, quotations and invoices together.</p><div className="mt-4 space-y-2 text-sm font-semibold text-violet-700"><Link className="block" href="/clients">Manage clients →</Link><Link className="block" href="/projects">Manage projects →</Link><Link className="block" href="/quotations">View quotations →</Link><Link className="block" href="/invoices">View invoices →</Link></div></section></aside>
    </div>
  </AppShell>;
}
