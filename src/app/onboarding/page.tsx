import Link from "next/link";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xl font-black tracking-[0.22em]">3DOT</Link>
        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Step 1 of 3</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Set up your company</h1>
          <p className="mt-3 text-slate-500">These details will appear on your quotations and invoices.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">Company name<input placeholder="Al Rayhan Contracting LLC" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label>
            <label className="text-sm font-semibold">TRN / VAT number<input placeholder="100000000000003" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label>
            <label className="text-sm font-semibold">City<input placeholder="Dubai" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500" /></label>
            <label className="text-sm font-semibold">Primary language<select className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-violet-500"><option>English</option><option>Arabic</option><option>English and Arabic</option></select></label>
          </div>
          <div className="mt-10 flex items-center justify-between"><Link href="/login" className="text-sm font-semibold text-slate-500">I already have an account</Link><Link href="/dashboard" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Continue to dashboard →</Link></div>
        </div>
      </div>
    </main>
  );
}
