"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string; contact_name: string | null; email: string | null; status: string };
type Project = { id: string; name: string; location: string | null; status: string; contract_value: number; clients: { name: string }[] | null };

export function CompanyResource({ type }: { type: "clients" | "projects" }) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const isClients = type === "clients";

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("Please sign in to manage your workspace.");
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
    if (!company) return setMessage("Complete company setup before adding records.");
    setCompanyId(company.id);
    const clientsResult = await supabase.from("clients").select("id,name,contact_name,email,status").eq("company_id", company.id).order("created_at", { ascending: false });
    setClients((clientsResult.data ?? []) as Client[]);
    if (!isClients) {
      const projectsResult = await supabase.from("projects").select("id,name,location,status,contract_value,clients(name)").eq("company_id", company.id).order("created_at", { ascending: false });
      setProjects((projectsResult.data ?? []) as unknown as Project[]);
    }
  }
  useEffect(() => { load(); }, [isClients]);

  async function create(formData: FormData) {
    if (!companyId) return;
    const result = isClients
      ? await supabase.from("clients").insert({ company_id: companyId, name: String(formData.get("name")), contact_name: String(formData.get("contact") || ""), email: String(formData.get("email") || ""), phone: String(formData.get("phone") || ""), status: String(formData.get("status")) })
      : await supabase.from("projects").insert({ company_id: companyId, client_id: String(formData.get("client_id") || "") || null, name: String(formData.get("name")), location: String(formData.get("location") || ""), status: String(formData.get("status")), contract_value: Number(formData.get("contract_value") || 0) });
    const { error } = result;
    if (error) return setMessage(error.message);
    setOpen(false); setMessage(""); await load();
  }

  const title = isClients ? "Clients" : "Projects";
  return <AppShell title={title} description={isClients ? "Keep every client contact and account in one place." : "Track jobs from quotation through handover."}>
    <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{isClients ? `${clients.length} client${clients.length === 1 ? "" : "s"}` : `${projects.length} project${projects.length === 1 ? "" : "s"}`}</p><button onClick={() => setOpen(!open)} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">+ {isClients ? "Add client" : "New project"}</button></div>
    {message && <div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message} {message.includes("setup") && <Link href="/onboarding" className="font-bold underline">Open setup</Link>}</div>}
    {open && <form action={create} className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6"><h2 className="text-lg font-bold">{isClients ? "Add a client" : "Create a project"}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><input required name="name" placeholder={isClients ? "Client company name" : "Project name"} className="rounded-xl border border-slate-300 bg-white px-4 py-3" />{isClients ? <><input name="contact" placeholder="Contact person" className="rounded-xl border border-slate-300 bg-white px-4 py-3" /><input type="email" name="email" placeholder="Email" className="rounded-xl border border-slate-300 bg-white px-4 py-3" /><input name="phone" placeholder="Phone" className="rounded-xl border border-slate-300 bg-white px-4 py-3" /></> : <><select name="client_id" className="rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="">No client selected</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><input name="location" placeholder="Site location" className="rounded-xl border border-slate-300 bg-white px-4 py-3" /><input type="number" min="0" name="contract_value" placeholder="Contract value (AED)" className="rounded-xl border border-slate-300 bg-white px-4 py-3" /></>}<select name="status" className="rounded-xl border border-slate-300 bg-white px-4 py-3"><option value={isClients ? "active" : "planning"}>{isClients ? "Active" : "Planning"}</option><option value={isClients ? "lead" : "in_progress"}>{isClients ? "Lead" : "In progress"}</option><option value={isClients ? "inactive" : "on_hold"}>{isClients ? "Inactive" : "On hold"}</option></select></div><button className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Save</button></form>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">{isClients ? clients.map((client) => <article key={client.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"><div><p className="font-semibold">{client.name}</p><p className="mt-1 text-sm text-slate-500">{client.contact_name || "No contact"}{client.email ? ` · ${client.email}` : ""}</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700">{client.status}</span></article>) : projects.map((project) => <article key={project.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"><div><p className="font-semibold">{project.name}</p><p className="mt-1 text-sm text-slate-500">{project.clients?.[0]?.name || "No client"}{project.location ? ` · ${project.location}` : ""}</p></div><div className="text-right"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700">{project.status.replace("_", " ")}</span><p className="mt-2 text-sm font-semibold">AED {Number(project.contract_value).toLocaleString()}</p></div></article>)}{((isClients && clients.length === 0) || (!isClients && projects.length === 0)) && <p className="p-8 text-center text-sm text-slate-500">No {title.toLowerCase()} yet. Use the button above to add one.</p>}</section>
  </AppShell>;
}
