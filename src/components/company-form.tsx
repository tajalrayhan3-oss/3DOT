"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function CompanyForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(formData: FormData) {
    setLoading(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return setMessage("Please sign in first."); }
    const { error } = await supabase.from("companies").insert({ owner_id: user.id, name: formData.get("name"), trn: formData.get("trn"), city: formData.get("city") });
    setLoading(false);
    if (error) return setMessage(error.message);
    window.location.href = "/dashboard";
  }
  return <form action={submit}><div className="mt-10 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Company name<input name="name" required placeholder="Al Rayhan Contracting LLC" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">TRN / VAT number<input name="trn" placeholder="100000000000003" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">City<input name="city" required placeholder="Dubai" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">Primary language<select name="language" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500"><option value="en">English</option><option value="ar">Arabic</option><option value="both">English and Arabic</option></select></label></div>{message && <p className="mt-5 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">{message}</p>}<div className="mt-10 flex justify-end"><button disabled={loading} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Saving..." : "Continue to dashboard →"}</button></div></form>;
}
