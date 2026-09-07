"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Project = { id: string; name: string; status: string };
type Invoice = { amount: number; status: string };
type Task = { id: string; project_id: string; title: string; due_date: string | null; priority: string; status: string; projects: { name: string }[] | null; employees: { name: string }[] | null };
type DashboardData = { projects: Project[]; tasks: Task[]; employeeCount: number; outstanding: number; clientCount: number; hoursLogged: number };
const currency = (value: number) => `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;

export function DashboardWorkspace() {
  const [data, setData] = useState<DashboardData>({ projects: [], tasks: [], employeeCount: 0, outstanding: 0, clientCount: 0, hoursLogged: 0 });
  const [message, setMessage] = useState("");

  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("Please sign in to view your workspace.");
    const { data: company, error } = await supabase.from("companies").select("id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return setMessage(error.message);
    if (!company) return setMessage("Complete company setup to view your workspace.");
    const today = new Date();
    const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);
    const [projectsResult, tasksResult, employeesResult, invoicesResult, clientsResult, timesheetsResult] = await Promise.all([
      supabase.from("projects").select("id,name,status").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("project_tasks").select("id,project_id,title,due_date,priority,status,projects(name),employees(name)").eq("company_id", company.id).neq("status", "completed").order("due_date", { ascending: true, nullsFirst: false }).limit(6),
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("active", true),
      supabase.from("invoices").select("amount,status").eq("company_id", company.id).in("status", ["sent", "overdue"]),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("company_id", company.id),
      supabase.from("timesheets").select("hours").eq("company_id", company.id).gte("work_date", weekStart),
    ]);
    const firstError = projectsResult.error || tasksResult.error || employeesResult.error || invoicesResult.error || clientsResult.error || timesheetsResult.error;
    if (firstError) return setMessage(firstError.message);
    const invoices = (invoicesResult.data ?? []) as Invoice[];
    setData({ projects: (projectsResult.data ?? []) as Project[], tasks: (tasksResult.data ?? []) as unknown as Task[], employeeCount: employeesResult.count ?? 0, outstanding: invoices.reduce((total, invoice) => total + Number(invoice.amount || 0), 0), clientCount: clientsResult.count ?? 0, hoursLogged: (timesheetsResult.data ?? []).reduce((total, row) => total + Number(row.hours || 0), 0) });
  })(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = data.tasks.filter((task) => task.due_date && task.due_date < today);
  const activeProjects = data.projects.filter((project) => project.status === "in_progress" || project.status === "planning").length;
  const nextAction = overdueTasks.length > 0 ? { title: `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`, text: "Open the project and update the delayed work before adding new tasks.", href: `/projects/${overdueTasks[0].project_id}`, button: "Review tasks" } : data.clientCount === 0 ? { title: "Add your first client", text: "Create a client profile, then connect projects, quotations and invoices.", href: "/clients", button: "Add client" } : data.projects.length === 0 ? { title: "Create your first project", text: "Connect a client to a project and start tracking your construction work.", href: "/projects", button: "New project" } : { title: "Create a quotation", text: "Turn your project information into a professional client quotation.", href: "/quotations", button: "New quotation" };
  const metrics = [["Active projects", String(activeProjects), data.projects.length ? "From your project list" : "Add your first project"], ["Overdue tasks", String(overdueTasks.length), overdueTasks.length ? "Action required" : "Nothing overdue"], ["Outstanding invoices", currency(data.outstanding), data.outstanding ? "Sent or overdue payments" : "No outstanding invoices"], ["Hours this week", `${data.hoursLogged}h`, data.hoursLogged ? "From submitted timesheets" : "No hours logged this week"]];

  return <AppShell title="Your workspace" description="Live information from your 3DOT account.">
    {message && <div className="mb-6 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message}</div>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, detail]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-3 text-sm text-violet-700">{detail}</p></article>)}</div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Upcoming & overdue tasks</h2><p className="mt-1 text-sm text-slate-500">Work requiring attention across your projects</p></div><Link href="/projects" className="text-sm font-semibold text-violet-700">All projects</Link></div><div className="mt-5 space-y-3">{data.tasks.map((task) => { const overdue = Boolean(task.due_date && task.due_date < today); return <article key={task.id} className={`rounded-xl border px-5 py-4 ${overdue ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><Link href={`/projects/${task.project_id}`} className="font-semibold text-slate-950 hover:text-violet-700">{task.title}</Link><p className="mt-1 text-sm text-slate-500">{task.projects?.[0]?.name || "Project"} · {task.employees?.[0]?.name || "Not assigned"}</p></div><div className="sm:text-right"><p className={`text-xs font-bold uppercase ${overdue ? "text-red-700" : "text-violet-700"}`}>{overdue ? "Overdue" : task.status.replace("_", " ")}</p><p className="mt-1 text-sm text-slate-500">{task.due_date ? new Date(`${task.due_date}T00:00:00`).toLocaleDateString("en-AE") : "No due date"}</p></div></div></article>; })}{data.tasks.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No pending tasks. Add tasks from a project profile.</p>}</div></section>
      <aside className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-semibold text-violet-300">NEXT ACTION</p><h2 className="mt-3 text-2xl font-semibold">{nextAction.title}</h2><p className="mt-3 text-sm leading-6 text-white/60">{nextAction.text}</p><Link href={nextAction.href} className="mt-8 inline-block rounded-xl bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-950">{nextAction.button}</Link></aside>
    </div>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Recent projects</h2><p className="mt-1 text-sm text-slate-500">Latest projects in your workspace</p></div><Link href="/projects" className="text-sm font-semibold text-violet-700">View all</Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{data.projects.slice(0, 6).map((project) => <article key={project.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4"><div><Link href={`/projects/${project.id}`} className="font-semibold text-slate-950 hover:text-violet-700">{project.name}</Link><p className="mt-1 text-sm capitalize text-slate-500">{project.status.replace("_", " ")}</p></div><Link href={`/projects/${project.id}`} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Open</Link></article>)}{data.projects.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No projects yet.</p>}</div></section>
  </AppShell>;
}
