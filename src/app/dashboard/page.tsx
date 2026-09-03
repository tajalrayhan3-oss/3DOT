import { AppShell } from "@/components/app-shell";

const metrics = [["Active projects", "0", "Add your first project"], ["Outstanding invoices", "AED 0", "No invoices yet"], ["Team on site", "0", "Add your first employee"]];

export default function DashboardPage() {
  return <AppShell title="Good afternoon, Tajal" description="Here is what needs your attention today.">
    <div className="grid gap-5 md:grid-cols-3">{metrics.map(([label, value, detail]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-3 text-sm text-violet-700">{detail}</p></article>)}</div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold">Project activity</h2><p className="mt-1 text-sm text-slate-500">Latest updates across your sites</p><p className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No activity yet. Add a client and project to get started.</p></section><aside className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-semibold text-violet-300">NEXT ACTION</p><h2 className="mt-3 text-2xl font-semibold">Add your first client</h2><p className="mt-3 text-sm leading-6 text-white/60">Create a client profile, then connect projects, quotations and invoices.</p><a href="/clients" className="mt-8 inline-block rounded-xl bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-950">Add client</a></aside></div>
  </AppShell>;
}
