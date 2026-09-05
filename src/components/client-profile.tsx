"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string; contact_name: string | null; email: string | null; phone: string | null; trn: string | null; address: string | null; website: string | null; status: string };
type Project = { id: string; name: string; status: string; location: string | null; contract_value: number };

export function ClientProfile({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("Loading client…");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!company) return setMessage("Complete company setup first.");
    const { data, error } = await supabase.from("clients").select("id,name,contact_name,email,phone,trn,address,website,status").eq("id", id).eq("company_id", company.id).maybeSingle();
    if (error || !data) return setMessage(error?.message || "Client not found.");
    setClient(data as Client);
    const { data: projectData } = await supabase.from("projects").select("id,name,status,location,contract_value").eq("client_id", id).eq("company_id", company.id).order("created_at", { ascending: false });
    setProjects((projectData ?? []) as Project[]);
    setMessage("");
  }
  useEffect(() => { void load(); }, [id]);

  async function save(formData: FormData) {
    if (!client) return;
    setMessage("");
    const { error } = await supabase.from("clients").update({ name: String(formData.get("name")), contact_name: String(formData.get("contact_name") || ""), email: String(formData.get("email") || ""), phone: String(formData.get("phone") || ""), trn: String(formData.get("trn") || ""), website: String(formData.get("website") || ""), address: String(formData.get("address") || ""), status: String(formData.get("status")) }).eq("id", client.id);
    if (error) return setMessage(error.message);
    setEditing(false); await load(); setMessage("Client details saved successfully.");
  }

  if (!client) return <AppShell title="Client profile" description="Client company details and projects."><p className="rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message}</p></AppShell>;
  const fields = [["Contact person", client.contact_name], ["Email", client.email], ["Phone", client.phone], ["TRN / VAT", client.trn], ["Website", client.website], ["Address", client.address]];

  return <AppShell title="Client profile" description="Company details, contacts and connected projects."><div className="mx-auto max-w-5xl"><Link href="/clients" className="text-sm font-semibold text-violet-700">← Back to clients</Link>{message && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{message}</p>}<section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">{editing ? <form action={save}><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Edit client</p><h2 className="mt-2 text-2xl font-bold">Update client company details</h2><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Client company name<input required name="name" defaultValue={client.name} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Contact person<input name="contact_name" defaultValue={client.contact_name ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Email<input name="email" type="email" defaultValue={client.email ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Phone<input name="phone" defaultValue={client.phone ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">TRN / VAT <span className="font-normal text-slate-400">(optional)</span><input name="trn" defaultValue={client.trn ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Website <span className="font-normal text-slate-400">(optional)</span><input name="website" type="url" defaultValue={client.website ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold sm:col-span-2">Address <span className="font-normal text-slate-400">(optional)</span><textarea name="address" defaultValue={client.address ?? ""} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Status<select name="status" defaultValue={client.status} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"><option value="lead">Lead</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div><div className="mt-8 flex gap-3"><button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Save client details</button><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">Cancel</button></div></form> : <><div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Saved client profile</p><h2 className="mt-2 text-3xl font-bold">{client.name}</h2><p className="mt-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold capitalize text-violet-700">{client.status}</p></div><button onClick={() => setEditing(true)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Edit client details</button></div><div className="mt-8 grid gap-6 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className={label === "Address" ? "sm:col-span-2" : ""}><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-2 whitespace-pre-line text-sm font-medium text-slate-800">{value || "Not added"}</p></div>)}</div></>}</section><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Projects</p><h2 className="mt-2 text-xl font-bold">Projects for {client.name}</h2></div><Link href="/projects" className="text-sm font-semibold text-violet-700">Manage projects →</Link></div><div className="mt-6 space-y-3">{projects.map((project) => <div key={project.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{project.name}</p><p className="mt-1 text-sm text-slate-500">{project.location || "No location"} · {project.status.replace("_", " ")}</p></div><p className="text-sm font-bold">AED {Number(project.contract_value).toLocaleString()}</p></div>)}{projects.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No projects are linked to this client yet.</p>}</div></section></div></AppShell>;
}
