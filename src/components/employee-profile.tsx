"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Employee = { id: string; name: string; job_title: string | null; email: string | null; monthly_rate: number | null; active: boolean };
type Assignment = { id: string; projects: { name: string; clients: { name: string } | null } | null };

export function EmployeeProfile({ id }: { id: string }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("Loading employee…");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data, error } = await supabase.from("employees").select("id,name,job_title,email,monthly_rate,active").eq("id", id).maybeSingle();
    if (error || !data) return setMessage(error?.message || "Employee not found.");
    setEmployee(data as Employee);
    const { data: assignmentData } = await supabase.from("employee_assignments").select("id,projects(name,clients(name))").eq("employee_id", id).eq("active", true);
    setAssignments((assignmentData ?? []) as unknown as Assignment[]);
    setMessage("");
  }
  useEffect(() => { void load(); }, [id]);

  async function save(formData: FormData) {
    if (!employee) return;
    const { error } = await supabase.from("employees").update({ name: String(formData.get("name")), job_title: String(formData.get("job_title") || "") || null, email: String(formData.get("email") || "") || null, monthly_rate: Number(formData.get("monthly_rate") || 0) || null, active: formData.get("active") === "active" }).eq("id", employee.id);
    if (error) return setMessage(error.message);
    setEditing(false); await load(); setMessage("Employee details saved successfully.");
  }

  if (!employee) return <AppShell title="Employee profile" description="Employee details and work assignments."><p className="rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message}</p></AppShell>;
  return <AppShell title="Employee profile" description="Employee details and current client project assignments."><div className="mx-auto max-w-5xl"><Link href="/team" className="text-sm font-semibold text-violet-700">← Back to team</Link>{message && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{message}</p>}<section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">{editing ? <form action={save}><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Edit employee</p><h2 className="mt-2 text-2xl font-bold">Update employee details</h2><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Employee name<input required name="name" defaultValue={employee.name} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Job title<input name="job_title" defaultValue={employee.job_title ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Email<input name="email" type="email" defaultValue={employee.email ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Monthly rate (AED)<input name="monthly_rate" type="number" min="0" defaultValue={employee.monthly_rate ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Status<select name="active" defaultValue={employee.active ? "active" : "inactive"} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div><div className="mt-8 flex gap-3"><button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Save employee details</button><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">Cancel</button></div></form> : <><div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Saved employee profile</p><h2 className="mt-2 text-3xl font-bold">{employee.name}</h2><p className="mt-2 text-sm text-slate-500">{employee.job_title || "Employee"}{employee.email ? ` · ${employee.email}` : ""}</p></div><button onClick={() => setEditing(true)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Edit employee details</button></div><div className="mt-8 grid gap-6 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Monthly rate</p><p className="mt-2 text-xl font-bold">{employee.monthly_rate ? `AED ${Number(employee.monthly_rate).toLocaleString()}` : "Not added"}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Status</p><p className="mt-2 text-xl font-bold">{employee.active ? "Active" : "Inactive"}</p></div></div></>}</section><section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Current assignments</p><h2 className="mt-2 text-xl font-bold">Where this employee is working</h2><div className="mt-6 space-y-3">{assignments.map((assignment) => <div key={assignment.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{assignment.projects?.clients?.name || "Client"} · {assignment.projects?.name || "Project"}</p></div>)}{assignments.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No active project assignment yet. Use the Team page to assign this employee.</p>}</div></section></div></AppShell>;
}
