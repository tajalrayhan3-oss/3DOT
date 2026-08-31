import { AppShell } from "@/components/app-shell";

type Row = { name: string; meta: string; status: string; amount?: string };

export function ResourcePage({ title, description, action, columns, rows }: { title: string; description: string; action: string; columns: string[]; rows: Row[] }) {
  return <AppShell title={title} description={description}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><input placeholder={`Search ${title.toLowerCase()}...`} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500" /></div><button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">+ {action}</button></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="hidden grid-cols-[1.4fr_1.4fr_1fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 md:grid">{columns.map((column) => <span key={column}>{column}</span>)}</div><div>{rows.map((row) => <article key={row.name} className="grid gap-2 border-b border-slate-100 px-6 py-5 last:border-0 md:grid-cols-[1.4fr_1.4fr_1fr_1fr] md:items-center md:gap-4"><div><p className="font-semibold">{row.name}</p><p className="mt-1 text-sm text-slate-500 md:hidden">{row.meta}</p></div><p className="hidden text-sm text-slate-500 md:block">{row.meta}</p><span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{row.status}</span><p className="text-sm font-medium text-slate-700">{row.amount ?? "—"}</p></article>)}</div></section>
  </AppShell>;
}
