"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Employee = { id: string; name: string; job_title: string | null; email: string | null; active: boolean; monthly_rate: number | null };
type Project = { id: string; name: string; clients: { name: string } | null };
type Timesheet = { id: string; work_date: string; hours: number; notes: string | null; employees: { name: string } | null; projects: { name: string } | null };
type Assignment = { id: string; active: boolean; employees: { name: string } | null; projects: { name: string; clients: { name: string } | null } | null };

export function TeamTimesheetResource({ type }: { type: "team" | "timesheets" }) {
  const [companyId, setCompanyId] = useState<string>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Please sign in to manage your workspace."); return; }
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!company) { setMessage("Complete company setup first."); return; }
    setCompanyId(company.id);
    const [{ data: staff }, { data: projectRows }, { data: timeRows }, { data: assignmentRows }] = await Promise.all([
      supabase.from("employees").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("projects").select("id,name,clients(name)").eq("company_id", company.id).order("name"),
      supabase.from("timesheets").select("*, employees(full_name), projects(name)").eq("company_id", company.id).order("work_date", { ascending: false }),
      supabase.from("employee_assignments").select("id,active,employees(name),projects(name,clients(name))").eq("company_id", company.id).eq("active", true).order("created_at", { ascending: false }),
    ]);
    setEmployees(staff ?? []); setProjects((projectRows as Project[] | null) ?? []); setTimesheets((timeRows as Timesheet[] | null) ?? []); setAssignments((assignmentRows as Assignment[] | null) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companyId) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("employees").insert({ company_id: companyId, name: form.get("name"), job_title: form.get("role") || null, email: form.get("email") || null, monthly_rate: Number(form.get("cost")) || null });
    setMessage(error ? error.message : "Employee added."); if (!error) { event.currentTarget.reset(); setShowForm(false); load(); }
  }
  async function submitTimesheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companyId) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("timesheets").insert({ company_id: companyId, employee_id: form.get("employee"), project_id: form.get("project") || null, work_date: form.get("date"), hours: Number(form.get("hours")), notes: form.get("notes") || null });
    setMessage(error ? error.message : "Timesheet submitted."); if (!error) { event.currentTarget.reset(); setShowForm(false); load(); }
  }

  async function updateEmployeeStatus(id: string, active: boolean) {
    const { error } = await supabase.from("employees").update({ active }).eq("id", id);
    setMessage(error ? error.message : "Employee status updated.");
    if (!error) await load();
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companyId) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("employee_assignments").upsert({ company_id: companyId, employee_id: form.get("employee"), project_id: form.get("project"), active: true }, { onConflict: "employee_id,project_id" });
    setMessage(error ? error.message : "Employee assigned to project.");
    if (!error) { event.currentTarget.reset(); setShowAssignment(false); await load(); }
  }

  const isTeam = type === "team";
  return <AppShell title={isTeam ? "Team" : "Timesheets"} description={isTeam ? "Manage employees, roles and site access." : "Track work hours across every construction site."}>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{isTeam ? `${employees.length} employees` : `${timesheets.length} timesheets`}</p><div className="flex gap-2">{isTeam && <button onClick={() => setShowAssignment(!showAssignment)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">Assign employee</button>}<button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">+ Add {isTeam ? "employee" : "timesheet"}</button></div></div>
    {showForm && <form onSubmit={isTeam ? submitEmployee : submitTimesheet} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      {isTeam ? <><input required name="name" placeholder="Employee name" className="rounded-xl border p-3"/><input name="role" placeholder="Role (e.g. Site Engineer)" className="rounded-xl border p-3"/><input name="email" type="email" placeholder="Email (optional)" className="rounded-xl border p-3"/><input name="cost" type="number" min="0" placeholder="Monthly cost (AED)" className="rounded-xl border p-3"/></> : <><select required name="employee" className="rounded-xl border p-3"><option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><select name="project" className="rounded-xl border p-3"><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input required name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-xl border p-3"/><input required name="hours" type="number" min="0.25" max="24" step="0.25" placeholder="Hours" className="rounded-xl border p-3"/><input name="notes" placeholder="Notes (optional)" className="rounded-xl border p-3 sm:col-span-2"/></>}
      <button className="w-fit rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">Save</button>
    </form>}
    {isTeam && showAssignment && <form onSubmit={submitAssignment} className="mt-5 grid gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:grid-cols-2"><h2 className="sm:col-span-2 text-lg font-bold">Assign employee to a project</h2><select required name="employee" className="rounded-xl border border-slate-300 bg-white p-3"><option value="">Select employee</option>{employees.filter((employee) => employee.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select><select required name="project" className="rounded-xl border border-slate-300 bg-white p-3"><option value="">Select client project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.clients?.name ? `${project.clients.name} · ` : ""}{project.name}</option>)}</select><button className="w-fit rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">Save assignment</button></form>}
    {message && <p className="mt-4 text-sm text-violet-700">{message}</p>}
    {isTeam && assignments.length > 0 && <section className="mt-6 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50"><div className="border-b border-violet-100 px-5 py-4"><h2 className="font-bold">Current project assignments</h2><p className="mt-1 text-sm text-slate-500">See who is working for each client and project.</p></div>{assignments.map((assignment) => <article key={assignment.id} className="flex items-center justify-between gap-4 border-b border-violet-100 px-5 py-4 last:border-0"><div><p className="font-semibold">{assignment.employees?.name ?? "Employee"}</p><p className="mt-1 text-sm text-slate-600">{assignment.projects?.clients?.name ?? "Client"} · {assignment.projects?.name ?? "Project"}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">assigned</span></article>)}</section>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">{isTeam ? employees.map(e => <article key={e.id} className="flex items-center justify-between border-b p-5 last:border-0"><div><p className="font-semibold">{e.name}</p><p className="text-sm text-slate-500">{e.job_title ?? "Employee"}{e.email ? ` · ${e.email}` : ""}</p></div><select aria-label={`${e.name} status`} value={e.active ? "active" : "inactive"} onChange={(event) => void updateEmployeeStatus(e.id, event.target.value === "active")} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"><option value="active">active</option><option value="inactive">inactive</option></select></article>) : timesheets.map(t => <article key={t.id} className="flex items-center justify-between border-b p-5 last:border-0"><div><p className="font-semibold">{t.employees?.name ?? "Employee"} · {t.hours}h</p><p className="text-sm text-slate-500">{t.work_date}{t.projects ? ` · ${t.projects.name}` : ""}</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">submitted</span></article>)}{(isTeam ? employees : timesheets).length === 0 && <p className="p-6 text-sm text-slate-500">Nothing added yet.</p>}</section>
  </AppShell>;
}
