"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string };
type LineItem = { description: string; quantity: number; unit_price: number; discount_percent: number; vat_percent: number };
type RecordItem = { id: string; client_id?: string | null; number: string; title?: string; amount: number; status: string; due_date?: string | null; paid_at?: string | null; clients: { name: string }[] | null };
const blankLine = (): LineItem => ({ description: "", quantity: 1, unit_price: 0, discount_percent: 0, vat_percent: 5 });
const money = (amount: number) => `AED ${Number(amount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const lineTotal = (line: LineItem) => {
  const subtotal = Number(line.quantity || 0) * Number(line.unit_price || 0);
  const afterDiscount = subtotal * (1 - Number(line.discount_percent || 0) / 100);
  return afterDiscount * (1 + Number(line.vat_percent || 0) / 100);
};

export function FinancialResource({ type }: { type: "quotations" | "invoices" }) {
  const quotation = type === "quotations";
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("Please sign in to manage your workspace.");
    const { data: company, error: companyError } = await supabase.from("companies").select("id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (companyError) return setMessage(companyError.message);
    if (!company) return setMessage("Complete company setup before adding records.");
    setCompanyId(company.id);
    const [clientsResult, recordsResult] = await Promise.all([
      supabase.from("clients").select("id,name").eq("company_id", company.id).order("name"),
      supabase.from(type).select(quotation ? "id,client_id,number,title,amount,status,clients(name)" : "id,client_id,number,amount,status,due_date,paid_at,clients(name)").eq("company_id", company.id).order("created_at", { ascending: false }),
    ]);
    if (clientsResult.error) return setMessage(clientsResult.error.message);
    if (recordsResult.error) return setMessage(recordsResult.error.message);
    setClients((clientsResult.data ?? []) as Client[]);
    setItems((recordsResult.data ?? []) as unknown as RecordItem[]);
  }
  useEffect(() => { void load(); }, [type]);

  const totals = useMemo(() => lines.reduce((all, line) => {
    const subtotal = Number(line.quantity || 0) * Number(line.unit_price || 0);
    const discount = subtotal * Number(line.discount_percent || 0) / 100;
    const taxable = subtotal - discount;
    all.subtotal += subtotal; all.discount += discount; all.vat += taxable * Number(line.vat_percent || 0) / 100; all.total += lineTotal(line);
    return all;
  }, { subtotal: 0, discount: 0, vat: 0, total: 0 }), [lines]);

  function changeLine(index: number, field: keyof LineItem, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [field]: field === "description" ? value : Math.max(0, Number(value)) } : line));
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companyId) return;
    const form = new FormData(event.currentTarget);
    const validLines = lines.filter((line) => line.description.trim());
    if (!validLines.length) return setMessage("Add at least one item with a description.");
    setSaving(true); setMessage("");
    const suffix = String(Date.now()).slice(-6);
    const base = { company_id: companyId, client_id: String(form.get("client_id") || "") || null, amount: totals.total, status: String(form.get("status")) };
    const parent = quotation
      ? await supabase.from("quotations").insert({ ...base, number: `Q-${suffix}`, title: String(form.get("title")) }).select("id").single()
      : await supabase.from("invoices").insert({ ...base, number: `INV-${suffix}`, due_date: String(form.get("due_date") || "") || null }).select("id").single();
    if (parent.error || !parent.data) { setSaving(false); return setMessage(parent.error?.message || "Could not save document."); }
    const lineRows = validLines.map((line) => ({ company_id: companyId, description: line.description.trim(), quantity: line.quantity, unit_price: line.unit_price, discount_percent: line.discount_percent, vat_percent: line.vat_percent, ...(quotation ? { quotation_id: parent.data.id } : { invoice_id: parent.data.id }) }));
    const { error } = await supabase.from("financial_line_items").insert(lineRows);
    setSaving(false); if (error) return setMessage(error.message);
    setOpen(false); setLines([blankLine()]); await load();
  }

  async function updateStatus(id: string, status: string) {
    setMessage(""); const values = quotation ? { status } : { status, paid_at: status === "paid" ? new Date().toISOString().slice(0, 10) : null };
    const { error } = await supabase.from(type).update(values).eq("id", id); if (error) return setMessage(error.message); await load();
  }

  async function createInvoiceFromQuotation(item: RecordItem) {
    if (!companyId) return; setSaving(true); setMessage("");
    const { data: quoteLines, error: quoteLinesError } = await supabase.from("financial_line_items").select("description,quantity,unit_price,discount_percent,vat_percent").eq("quotation_id", item.id);
    if (quoteLinesError) { setSaving(false); return setMessage(quoteLinesError.message); }
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
    const suffix = String(Date.now()).slice(-6);
    const { data: invoice, error } = await supabase.from("invoices").insert({ company_id: companyId, client_id: item.client_id ?? null, number: `INV-${suffix}`, amount: item.amount, status: "draft", due_date: dueDate.toISOString().slice(0, 10) }).select("id").single();
    if (error || !invoice) { setSaving(false); return setMessage(error?.message || "Could not create invoice."); }
    if (quoteLines?.length) {
      const { error: linesError } = await supabase.from("financial_line_items").insert(quoteLines.map((line) => ({ ...line, company_id: companyId, invoice_id: invoice.id })));
      if (linesError) { setSaving(false); return setMessage(linesError.message); }
    }
    setSaving(false); setMessage(`Invoice created from ${item.number}. Open Invoices to review it.`);
  }

  const title = quotation ? "Quotations" : "Invoices";
  const singular = quotation ? "quotation" : "invoice";
  const statuses = quotation ? ["draft", "sent", "accepted", "rejected"] : ["draft", "sent", "paid", "overdue"];
  const visibleItems = items.filter((item) => [item.number, item.title, item.clients?.[0]?.name].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  return <AppShell title={title} description={quotation ? "Create professional quotes with VAT and itemised work." : "Issue itemised invoices and stay on top of payments."}>
    <div className="flex items-center justify-between gap-4"><p className="text-sm text-slate-500">{items.length} {singular}{items.length === 1 ? "" : "s"}</p><button onClick={() => setOpen(!open)} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">+ New {singular}</button></div>
    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500" />
    {message && <div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message} {message.includes("setup") && <Link href="/onboarding" className="font-bold underline">Open setup</Link>}</div>}
    {open && <form onSubmit={create} className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6"><h2 className="text-lg font-bold">New {singular}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><select name="client_id" className="rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="">No client selected</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>{quotation && <input required name="title" placeholder="Quotation title" className="rounded-xl border border-slate-300 bg-white px-4 py-3" />}{!quotation && <input type="date" name="due_date" className="rounded-xl border border-slate-300 bg-white px-4 py-3" />}<select name="status" className="rounded-xl border border-slate-300 bg-white px-4 py-3">{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white"><div className="min-w-[760px]"><div className="grid grid-cols-[minmax(190px,1fr)_92px_110px_92px_92px_52px] gap-2 border-b bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>Description</span><span>Qty</span><span>Rate</span><span>Disc. %</span><span>VAT %</span><span /></div>{lines.map((line, index) => <div key={index} className="grid grid-cols-[minmax(190px,1fr)_92px_110px_92px_92px_52px] gap-2 border-b px-3 py-3 last:border-0"><input required value={line.description} onChange={(event) => changeLine(index, "description", event.target.value)} placeholder="e.g. Blockwork labour" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input required min="0.01" step="0.01" type="number" value={line.quantity} onChange={(event) => changeLine(index, "quantity", event.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" /><input min="0" step="0.01" type="number" value={line.unit_price} onChange={(event) => changeLine(index, "unit_price", event.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" /><input min="0" max="100" step="0.01" type="number" value={line.discount_percent} onChange={(event) => changeLine(index, "discount_percent", event.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" /><input min="0" max="100" step="0.01" type="number" value={line.vat_percent} onChange={(event) => changeLine(index, "vat_percent", event.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" /><button type="button" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, i) => i !== index))} className="rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30" aria-label="Remove item">×</button></div>)}</div></div>
      <button type="button" onClick={() => setLines((current) => [...current, blankLine()])} className="mt-3 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700">+ Add item</button><div className="ml-auto mt-5 max-w-xs space-y-2 rounded-xl bg-white p-4 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></p><p className="flex justify-between"><span>Discount</span><span>− {money(totals.discount)}</span></p><p className="flex justify-between"><span>VAT</span><span>{money(totals.vat)}</span></p><p className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{money(totals.total)}</span></p></div><button disabled={saving} className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : `Save ${singular}`}</button></form>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">{visibleItems.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"><div><p className="font-semibold">{item.number}{item.title ? ` · ${item.title}` : ""}</p><p className="mt-1 text-sm text-slate-500">{item.clients?.[0]?.name || "No client"}{item.paid_at ? ` · Paid ${new Date(`${item.paid_at}T00:00:00`).toLocaleDateString("en-AE")}` : item.due_date ? ` · Due ${new Date(`${item.due_date}T00:00:00`).toLocaleDateString("en-AE")}` : ""}</p></div><div className="flex flex-wrap items-center justify-end gap-3 text-right"><div><select aria-label={`${item.number} status`} value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value)} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><p className="mt-2 text-sm font-semibold">{money(item.amount)}</p></div>{quotation && item.status === "accepted" && <button disabled={saving} onClick={() => void createInvoiceFromQuotation(item)} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Create invoice</button>}<Link href={`/${type}/${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Open</Link></div></article>)}{visibleItems.length === 0 && <p className="p-8 text-center text-sm text-slate-500">{search ? `No ${title.toLowerCase()} match your search.` : `No ${title.toLowerCase()} yet. Use the button above to create one.`}</p>}</section>
  </AppShell>;
}
