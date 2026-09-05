"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string };
type Project = { id: string; name: string; location: string | null; status: string; contract_value: number; client_id: string | null; clients: { name: string }[] | null };
type Assignment = { id: string; employees: { name: string; job_title: string | null }[] | null };

export function ProjectProfile({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("Loading project…");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data, error } = await supabase.from("projects").select("id,name,location,status,contract_value,client_id,clients(name)").eq("id", id).maybeSingle();
    if (error || !data) return setMessage(error?.message || "Project not found.");
    setProject(data as unknown as Project);
    const { data: clientData } = await supabase.from("clients").select("id,name").order("name");
    setClients((clientData ?? []) as Client[]);
    const { data: assignmentData } = await supabase.from("employee_assignments").select("id,employees(name,job_title)").eq("project_id", id).eq("active", true);
    setAssignments((assignmentData ?? []) as unknown as Assignment[]);
    setMessage("");
  }
  useEffect(() => { void load(); }, [id]);

  async function save(formData: FormData) {
    if (!project) return;
    const { error } = await supabase.from("projects").update({ name: String(formData.get("name")), client_id: String(formData.get("client_id") || "") || null, location: String(formData.get("location") || ""), contract_value: Number(formData.get("contract_value") || 0), status: String(formData.get("status")) }).eq("id", project.id);
    if (error) return setMessage(error.message);
    setEditing(false); await load(); setMessage("Project details saved successfully.");
  }

  if (!project) return <AppShell title="Project profile" description="Project details and site team."><p className="rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message}</p></AppShell>;
  return <AppShell title="Project profile" description="Project details, client and assigned team."><div className="mx-auto max-w-5xl"><Link href="/projects" className="text-sm font-semibold text-violet-700">← Back to projects</Link>{message && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{message}</p>}<section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">{editing ? <form action={save}><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Edit project</p><h2 className="mt-2 text-2xl font-bold">Update project details</h2><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Project name<input required name="name" defaultValue={project.name} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Client<select name="client_id" defaultValue={project.client_id ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="">No client selected</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label className="text-sm font-semibold">Site location<input name="location" defaultValue={project.location ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Contract value (AED)<input type="number" min="0" name="contract_value" defaultValue={project.contract_value} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Status<select name="status" defaultValue={project.status} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></select></label></div><div className="mt-8 flex gap-3"><button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Save project details</button><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">Cancel</button></div></form> : <><div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Saved project profile</p><h2 className="mt-2 text-3xl font-bold">{project.name}</h2><p className="mt-2 text-sm text-slate-500">{project.clients?.[0]?.name || "No client selected"}{project.location ? ` · ${project.location}` : ""}</p></div><button onClick={() => setEditing(true)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Edit project details</button></div><div className="mt-8 grid gap-6 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Contract value</p><p className="mt-2 text-xl font-bold">AED {Number(project.contract_value).toLocaleString()}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Status</p><p className="mt-2 text-xl font-bold capitalize">{project.status.replace("_", " ")}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Client</p><p className="mt-2 text-xl font-bold">{project.clients?.[0]?.name || "Not selected"}</p></div></div></>}</section><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Site team</p><h2 className="mt-2 text-xl font-bold">Employees assigned to this project</h2></div><Link href="/team" className="text-sm font-semibold text-violet-700">Manage team →</Link></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{assignments.map((assignment) => <div key={assignment.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{assignment.employees?.[0]?.name || "Employee"}</p><p className="mt-1 text-sm text-slate-500">{assignment.employees?.[0]?.job_title || "Team member"}</p></div>)}{assignments.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 sm:col-span-2">No employee is assigned yet. Use the Team page to assign employees to this project.</p>}</div></section></div></AppShell>;
}
