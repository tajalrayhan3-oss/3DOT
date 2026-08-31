import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-violet-500 p-12 text-slate-950 lg:flex">
        <p className="text-2xl font-black tracking-[0.24em]">3DOT</p>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em]">Build with clarity</p>
          <h1 className="mt-4 max-w-lg text-6xl font-semibold tracking-tight">Every site. Every team. One view.</h1>
        </div>
        <p className="text-sm font-medium">Made for construction teams in the UAE.</p>
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-16">
        <form className="w-full max-w-md">
          <Link href="/" className="text-xl font-black tracking-[0.22em] text-slate-950 lg:hidden">3DOT</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Welcome back</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">Sign in to your workspace</h2>
          <p className="mt-3 text-slate-500">Manage the work that moves your business forward.</p>
          <label className="mt-10 block text-sm font-semibold">Email address</label>
          <input type="email" placeholder="you@company.ae" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          <label className="mt-5 block text-sm font-semibold">Password</label>
          <input type="password" placeholder="••••••••" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          <button type="button" className="mt-7 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">Sign in</button>
          <p className="mt-6 text-center text-sm text-slate-500">New to 3DOT? <Link href="/onboarding" className="font-semibold text-violet-700">Create your company workspace</Link></p>
        </form>
      </section>
    </main>
  );
}
