import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  ["Dashboard", "/dashboard"],
  ["Clients", "/clients"],
  ["Projects", "/projects"],
  ["Team", "/team"],
  ["Timesheets", "/timesheets"],
  ["Quotations", "/quotations"],
  ["Invoices", "/invoices"],
];

export function AppShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <Link href="/dashboard" className="text-xl font-black tracking-[0.22em] text-slate-950">3DOT</Link>
          <p className="mt-2 text-xs font-medium text-slate-400">CONSTRUCTION MANAGEMENT</p>
          <nav className="mt-10 space-y-1">
            {navigation.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-sm font-semibold">Your workspace is ready</p>
            <p className="mt-1 text-xs leading-5 text-white/60">Add clients, projects and your site team in one place.</p>
            <Link href="/clients" className="mt-4 inline-block text-sm font-semibold text-violet-300">Add a client →</Link>
          </div>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 sm:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">3DOT workspace</p>
              <h1 className="mt-1 text-xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/onboarding" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold sm:block">Company setup</Link>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">TR</div>
            </div>
          </header>
          <div className="p-6 sm:p-10">{children}</div>
        </section>
      </div>
    </main>
  );
}
