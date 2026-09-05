"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string };
type RecordItem = {
  id: string;
  number: string;
  title?: string;
  amount: number;
  status: string;
  due_date?: string | null;
  clients: { name: string }[] | null;
};

const money = (amount: number) => `AED ${Number(amount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialResource({ type }: { type: "quotations" | "invoices" }) {
  const quotation = type === "quotations";
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("Please sign in to manage your workspace.");
    const { data: company, error: companyError } = await supabase.from("companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
    if (companyError) return setMessage(companyError.message);
    if (!company) return setMessage("Complete company setup before adding records.");
    setCompanyId(company.id);
    const [clientsResult, recordsResult] = await Promise.all([
      supabase.from("clients").select("id,name").eq("company_id", company.id).order("name"),
      supabase.from(type).select(quotation ? "id,number,title,amount,status,clients(name)" : "id,number,amount,status,due_date,clients(name)").eq("company_id", company.id).order("created_at", { ascending: false }),
    ]);
    if (clientsResult.error) return setMessage(clientsResult.error.message);
    if (recordsResult.error) return setMessage(recordsResult.error.message);
    setClients((clientsResult.data ?? []) as Client[]);
    setItems((recordsResult.data ?? []) as unknown as RecordItem[]);
  }

  useEffect(() => { void load(); }, [type]);

  async function create(formData: FormData) {
    if (!companyId) return;
    setSaving(true);
    setMessage("");
    const suffix = String(Date.now()).slice(-6);
    const base = { company_id: companyId, client_id: String(formData.get("client_id") || "") || null, amount: Number(formData.get("amount") || 0), status: String(formData.get("status")) };
    const { error } = quotation
      ? await supabase.from("quotations").insert({ ...base, number: `Q-${suffix}`, title: String(formData.get("title")) })
      : await supabase.from("invoices").insert({ ...base, number: `INV-${suffix}`, due_date: String(formData.get("due_date") || "") || null });
    setSaving(false);
    if (error) return setMessage(error.message);
    setOpen(false);
    await load();
  }

  const title = quotation ? "Quotations" : "Invoices";
  const singular = quotation ? "quotation" : "invoice";
  const statuses = quotation ? ["draft", "sent", "accepted", "rejected"] : ["draft", "sent", "paid", "overdue"];
  return <AppShell title={title} description={quotation ? "Create professional quotes and track client approval." : "Issue invoices and stay on top of payments."}>
    <div className="flex items-center justify-between gap-4"><p className="text-sm text-slate-500">{items.length} {singular}{items.length === 1 ? "" : "s"}</p><button onClick={() => setOpen(!open)} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">+ New {singular}</button></div>
    {message && <div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message} {message.includes("setup") && <Link href="/onboarding" className="font-bold underline">Open setup</Link>}</div>}
    {open && <form action={create} className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6"><h2 className="text-lg font-bold">New {singular}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><select name="client_id" className="rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="">No client selected</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>{quotation && <input required name="title" placeholder="Quotation title" className="rounded-xl border border-slate-300 bg-white px-4 py-3" />}<input required min="0" step="0.01" type="number" name="amount" placeholder="Amount (AED)" className="rounded-xl border border-slate-300 bg-white px-4 py-3" />{!quotation && <input type="date" name="due_date" className="rounded-xl border border-slate-300 bg-white px-4 py-3" />}<select name="status" className="rounded-xl border border-slate-300 bg-white px-4 py-3">{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></div><button disabled={saving} className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : `Save ${singular}`}</button></form>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">{items.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"><div><p className="font-semibold">{item.number}{item.title ? ` · ${item.title}` : ""}</p><p className="mt-1 text-sm text-slate-500">{item.clients?.[0]?.name || "No client"}{item.due_date ? ` · Due ${new Date(`${item.due_date}T00:00:00`).toLocaleDateString("en-AE")}` : ""}</p></div><div className="flex items-center gap-4 text-right"><div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700">{item.status}</span><p className="mt-2 text-sm font-semibold">{money(item.amount)}</p></div><Link href={`/${type}/${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Open</Link></div></article>)}{items.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No {title.toLowerCase()} yet. Use the button above to create one.</p>}</section>
  </AppShell>;
}
