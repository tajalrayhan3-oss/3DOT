export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d0d0f] px-6 py-8 text-white sm:px-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="text-xl font-bold tracking-[0.26em]">3DOT</span>
        <span className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70">Early access</span>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col items-center py-28 text-center sm:py-40">
        <p className="mb-6 text-sm font-semibold tracking-[0.22em] text-violet-300">THREE DOTS. ONE FOCUS.</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Ideas, brought into focus.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
          3DOT is your calm, focused space to collect what matters and move your best ideas forward.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button className="rounded-full bg-violet-400 px-7 py-3 font-semibold text-zinc-950 transition hover:bg-violet-300">Get started</button>
          <button className="rounded-full border border-white/20 px-7 py-3 font-semibold transition hover:bg-white/10">Sign in</button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 pb-16 sm:grid-cols-3">
        {[
          ["01", "Capture", "Save a spark the moment it appears."],
          ["02", "Connect", "Let related thoughts find each other."],
          ["03", "Create", "Turn a small idea into real momentum."],
        ].map(([number, title, description]) => (
          <article key={number} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-left">
            <p className="text-sm text-violet-300">{number}</p>
            <h2 className="mt-10 text-2xl font-semibold">{title}</h2>
            <p className="mt-3 leading-7 text-white/55">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
