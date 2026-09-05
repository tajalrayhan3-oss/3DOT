"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const details = [["TRN / VAT", company?.trn], ["City", company?.city], ["Email", company?.email], ["Phone", company?.phone], ["Website", company?.website], ["Address", company?.address]];

  return <main className="min-h-screen bg-slate-50 text-slate-900"><div className="mx-auto flex min-h-screen max-w-[1440px]">
    <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white p-6 sm:p-8">
      <Link href="/dashboard" className="text-xl font-black tracking-[0.22em]">3DOT</Link>
      <p className="mt-2 text-xs font-medium text-slate-400">COMPANY PROFILE</p>
      <div className="mt-10">{company?.logo_url && <img src={company.logo_url} alt={`${company.name} logo`} className="h-20 w-20 rounded-2xl border border-slate-200 object-contain p-2" />}<p className="mt-4 text-lg font-bold">{company?.name || "Your company"}</p><p className="mt-1 text-sm text-slate-500">Saved company details</p></div>
      <div className="mt-7 space-y-5 border-t border-slate-200 pt-6">{details.map(([label, value]) => <div key={label}><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 break-words whitespace-pre-line text-sm font-medium text-slate-700">{value || "Not added"}</p></div>)}</div>
      <button onClick={() => setEditing(true)} className="mt-auto rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Edit company details</button>
    </aside>
    <section className="min-w-0 flex-1 p-6 sm:p-10"><div className="mx-auto max-w-4xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">3DOT company & account</p><h1 className="mt-2 text-3xl font-bold">{editing ? "Edit company profile" : "Company profile"}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{editing ? "Update only the details you want to change, then save." : "Your company branding is used on quotations and invoices."}</p></div><Link href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">Back to dashboard</Link></div>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">{editing || !company ? <CompanyForm redirectTo="/company" /> : <><div className="grid gap-5 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Letterhead</p>{company.letterhead_url ? <a href={company.letterhead_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-violet-700">View saved letterhead →</a> : <p className="mt-3 text-sm text-slate-500">Not added</p>}</div><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Signature & stamp</p><div className="mt-3 flex items-center gap-4">{company.signature_url ? <img src={company.signature_url} alt="Saved signature" className="h-10 max-w-32 object-contain" /> : <span className="text-sm text-slate-500">Signature not added</span>}{company.stamp_url && <img src={company.stamp_url} alt="Saved stamp" className="h-12 w-12 object-contain" />}</div></div></div><div className="mt-8 border-t border-slate-200 pt-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Quotation & invoice footer</p><p className="mt-2 text-sm leading-6 text-slate-600">{company.document_footer || "Not added"}</p></div></>}</div>
      <div className="mt-6 grid gap-6 md:grid-cols-2"><section className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">Signed in account</p><p className="mt-3 break-words text-sm font-semibold">{email}</p><button onClick={() => void signOut()} className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">Log out</button></section><section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold">3DOT workspace</p><p className="mt-2 text-sm leading-6 text-slate-500">Use your workspace to manage clients, projects, team, timesheets, quotations and invoices.</p></section></div>
    </div></section>
  </div></main>;
}
