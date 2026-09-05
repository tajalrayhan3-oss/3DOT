"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Project = { id: string; name: string; status: string };
type Invoice = { amount: number; status: string };
type DashboardData = { projects: Project[]; employeeCount: number; outstanding: number; clientCount: number; hoursLogged: number };
const currency = (value: number) => `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;

export function DashboardWorkspace() {
  const [data, setData] = useState<DashboardData>({ projects: [], employeeCount: 0, outstanding: 0, clientCount: 0, hoursLogged: 0 });
  const [message, setMessage] = useState("");
  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("Please sign in to view your workspace.");
    const { data: company, error } = await supabase.from("companies").select("id").eq("owner_id", user.id).maybeSingle();
    if (error) return setMessage(error.message);
    if (!company) return setMessage("Complete company setup to view your workspace.");
    const today = new Date();
    const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);
    const [projectsResult, employeesResult, invoicesResult, clientsResult, timesheetsResult] = await Promise.all([
      supabase.from("projects").select("id,name,status").eq("company_id", company.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("active", true),
      supabase.from("invoices").select("amount,status").eq("company_id", company.id).in("status", ["sent", "overdue"]),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("company_id", company.id),
      supabase.from("timesheets").select("hours").eq("company_id", company.id).gte("work_date", weekStart),
    ]);
    const firstError = projectsResult.error || employeesResult.error || invoicesResult.error || clientsResult.error || timesheetsResult.error;
    if (firstError) return setMessage(firstError.message);
    const invoices = (invoicesResult.data ?? []) as Invoice[];
    setData({ projects: (projectsResult.data ?? []) as Project[], employeeCount: employeesResult.count ?? 0, outstanding: invoices.reduce((total, invoice) => total + Number(invoice.amount || 0), 0), clientCount: clientsResult.count ?? 0, hoursLogged: (timesheetsResult.data ?? []).reduce((total, row) => total + Number(row.hours || 0), 0) });
  })(); }, []);
  const activeProjects = data.projects.filter((project) => project.status === "in_progress" || project.status === "planning").length;
  const nextAction = data.clientCount === 0 ? { title: "Add your first client", text: "Create a client profile, then connect projects, quotations and invoices.", href: "/clients", button: "Add client" } : data.projects.length === 0 ? { title: "Create your first project", text: "Connect a client to a project and start tracking your construction work.", href: "/projects", button: "New project" } : { title: "Create a quotation", text: "Turn your project information into a professional client quotation.", href: "/quotations", button: "New quotation" };
  const metrics = [["Active projects", String(activeProjects), data.projects.length ? "From your project list" : "Add your first project"], ["Outstanding invoices", currency(data.outstanding), data.outstanding ? "Sent or overdue payments" : "No outstanding invoices"], ["Active team", String(data.employeeCount), data.employeeCount ? "Employees marked active" : "Add your site team"], ["Hours this week", `${data.hoursLogged}h`, data.hoursLogged ? "From submitted timesheets" : "No hours logged this week"]];
  return <AppShell title="Your workspace" description="Live information from your 3DOT account.">
    {message && <div className="mb-6 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">{message}</div>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, detail]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-3 text-sm text-violet-700">{detail}</p></article>)}</div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Recent projects</h2><p className="mt-1 text-sm text-slate-500">Latest projects in your workspace</p></div><Link href="/projects" className="text-sm font-semibold text-violet-700">View all</Link></div><div className="mt-5 space-y-3">{data.projects.map((project) => <article key={project.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4"><div><p className="font-semibold">{project.name}</p><p className="mt-1 text-sm capitalize text-slate-500">{project.status.replace("_", " ")}</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Project</span></article>)}{data.projects.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No projects yet. Add a client and create your first project.</p>}</div></section><aside className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-semibold text-violet-300">NEXT ACTION</p><h2 className="mt-3 text-2xl font-semibold">{nextAction.title}</h2><p className="mt-3 text-sm leading-6 text-white/60">{nextAction.text}</p><Link href={nextAction.href} className="mt-8 inline-block rounded-xl bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-950">{nextAction.button}</Link></aside></div>
  </AppShell>;
}
