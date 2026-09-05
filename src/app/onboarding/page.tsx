import Link from "next/link";
import { CompanyForm } from "@/components/company-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xl font-black tracking-[0.22em]">3DOT</Link>
        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Company profile</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Set up your company</h1>
          <p className="mt-3 text-slate-500">Update company details and document branding in one place.</p>
          <CompanyForm />
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-slate-500">I already have an account</Link>
        </div>
      </div>
    </main>
  );
}
