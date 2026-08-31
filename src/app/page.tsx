import Link from "next/link";

export default function Home() {
  const features = [["01", "Win work", "Create professional quotations in English and Arabic."], ["02", "Run sites", "Keep projects, people and timesheets in sync."], ["03", "Get paid", "Send invoices with your company details and VAT."]];

  return <main className="min-h-screen bg-slate-950 px-6 py-8 text-white sm:px-10">
    <nav className="mx-auto flex max-w-6xl items-center justify-between"><span className="text-xl font-black tracking-[0.26em]">3DOT</span><Link href="/login" className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold">Sign in</Link></nav>
    <section className="mx-auto flex max-w-6xl flex-col items-center py-28 text-center sm:py-40"><p className="mb-6 text-sm font-semibold tracking-[0.22em] text-violet-300">CONSTRUCTION MANAGEMENT FOR UAE TEAMS</p><h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">Build every project with clarity.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-white/60">3DOT brings your clients, projects, site teams, quotations and invoices into one practical workspace.</p><div className="mt-10 flex flex-col gap-3 sm:flex-row"><Link href="/onboarding" className="rounded-full bg-violet-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-violet-300">Start your 7-day trial</Link><Link href="/dashboard" className="rounded-full border border-white/20 px-7 py-3 font-semibold transition hover:bg-white/10">View workspace</Link></div></section>
    <section className="mx-auto grid max-w-5xl gap-4 pb-16 sm:grid-cols-3">{features.map(([number, title, description]) => <article key={number} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-left"><p className="text-sm text-violet-300">{number}</p><h2 className="mt-10 text-2xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-white/55">{description}</p></article>)}</section>
  </main>;
}
