"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Company = { id: string; name: string; trn: string | null; city: string | null; logo_url: string | null; document_footer: string | null };

export function CompanyForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("companies").select("id,name,trn,city,logo_url,document_footer").eq("owner_id", user.id).maybeSingle();
    setCompany(data as Company | null);
  })(); }, []);
  async function submit(formData: FormData) {
    setLoading(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return setMessage("Please sign in first."); }
    const values = { name: String(formData.get("name")), trn: String(formData.get("trn") || "") || null, city: String(formData.get("city")), logo_url: String(formData.get("logo_url") || "") || null, document_footer: String(formData.get("document_footer") || "") || null };
    const { error } = company
      ? await supabase.from("companies").update(values).eq("id", company.id)
      : await supabase.from("companies").insert({ owner_id: user.id, ...values });
    setLoading(false);
    if (error) return setMessage(error.message);
    window.location.href = "/dashboard";
  }
  return <form action={submit}><div className="mt-10 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Company name<input name="name" required defaultValue={company?.name ?? ""} placeholder="Al Rayhan Contracting LLC" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">TRN / VAT number<input name="trn" defaultValue={company?.trn ?? ""} placeholder="100000000000003" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">City<input name="city" required defaultValue={company?.city ?? ""} placeholder="Dubai" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">Logo URL<input name="logo_url" type="url" defaultValue={company?.logo_url ?? ""} placeholder="https://yourcompany.com/logo.png" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold sm:col-span-2">Quotation & invoice footer<textarea name="document_footer" defaultValue={company?.document_footer ?? ""} placeholder="Thank you for your business. Terms and conditions apply." className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label></div>{message && <p className="mt-5 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">{message}</p>}<div className="mt-10 flex justify-end"><button disabled={loading} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Saving..." : company ? "Save company profile" : "Continue to dashboard →"}</button></div></form>;
}
