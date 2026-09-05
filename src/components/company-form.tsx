"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Company = { id: string; name: string; trn: string | null; city: string | null; logo_url: string | null; letterhead_url: string | null; document_footer: string | null };

export function CompanyForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("companies").select("id,name,trn,city,logo_url,letterhead_url,document_footer").eq("owner_id", user.id).maybeSingle();
    setCompany(data as Company | null);
  })(); }, []);
  async function submit(formData: FormData) {
    setLoading(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return setMessage("Please sign in first."); }
    const upload = async (field: "logo" | "letterhead", currentUrl: string | null) => {
      const file = formData.get(field);
      if (!(file instanceof File) || file.size === 0) return currentUrl;
      if (!file.type.startsWith("image/")) throw new Error("Please upload an image file (PNG, JPG or WebP).");
      if (file.size > 10 * 1024 * 1024) throw new Error("Image must be smaller than 10 MB.");
      const extension = file.name.split(".").pop() || "png";
      const path = `${user.id}/${field}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("company-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      return supabase.storage.from("company-assets").getPublicUrl(path).data.publicUrl;
    };
    try {
      const [logoUrl, letterheadUrl] = await Promise.all([upload("logo", company?.logo_url ?? null), upload("letterhead", company?.letterhead_url ?? null)]);
      const values = { name: String(formData.get("name")), trn: String(formData.get("trn") || "") || null, city: String(formData.get("city")), logo_url: logoUrl, letterhead_url: letterheadUrl, document_footer: String(formData.get("document_footer") || "") || null };
    const { error } = company
      ? await supabase.from("companies").update(values).eq("id", company.id)
      : await supabase.from("companies").insert({ owner_id: user.id, ...values });
    setLoading(false);
    if (error) return setMessage(error.message);
    window.location.href = "/dashboard";
    } catch (uploadError) {
      setLoading(false);
      setMessage(uploadError instanceof Error ? uploadError.message : "Image upload failed. Please try again.");
    }
  }
  return <form key={company?.id ?? "new-company"} action={submit}><div className="mt-10 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Company name<input name="name" required defaultValue={company?.name ?? ""} placeholder="Al Rayhan Contracting LLC" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">TRN / VAT number <span className="font-normal text-slate-400">(optional)</span><input name="trn" defaultValue={company?.trn ?? ""} placeholder="100000000000003" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">City<input name="city" required defaultValue={company?.city ?? ""} placeholder="Dubai" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label><label className="text-sm font-semibold">Company logo <span className="font-normal text-slate-400">(optional)</span><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-700" /><span className="mt-2 block text-xs font-normal text-slate-500">PNG, JPG or WebP · max 10 MB</span>{company?.logo_url && <span className="mt-1 block text-xs font-normal text-violet-700">Logo already uploaded. Choose a new image to replace it.</span>}</label><label className="text-sm font-semibold sm:col-span-2">Letterhead image <span className="font-normal text-slate-400">(optional)</span><input name="letterhead" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-700" /><span className="mt-2 block text-xs font-normal text-slate-500">Full-page image for quotations and invoices · PNG, JPG or WebP · max 10 MB</span>{company?.letterhead_url && <span className="mt-1 block text-xs font-normal text-violet-700">Letterhead already uploaded. Choose a new image to replace it.</span>}</label><label className="text-sm font-semibold sm:col-span-2">Quotation & invoice footer <span className="font-normal text-slate-400">(optional)</span><textarea name="document_footer" defaultValue={company?.document_footer ?? ""} placeholder="Thank you for your business. Terms and conditions apply." className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label></div>{message && <p className="mt-5 rounded-lg bg-violet-50 p-3 text-sm text-violet-800">{message}</p>}<div className="mt-10 flex justify-end"><button disabled={loading} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Uploading..." : company ? "Save company profile" : "Continue to dashboard →"}</button></div></form>;
}
