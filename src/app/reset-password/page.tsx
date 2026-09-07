import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-16"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10"><Link href="/login" className="text-xl font-black tracking-[0.22em] text-slate-950">3DOT</Link><ResetPasswordForm /><Link href="/login" className="mt-6 block text-center text-sm font-semibold text-violet-700">← Back to sign in</Link></section></main>;
}
