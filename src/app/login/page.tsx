import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

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
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">Welcome to 3DOT</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">Your construction workspace</h2>
          <p className="mt-3 text-slate-500">Create an account to begin, or sign in to continue.</p>
          <AuthForm />
        </form>
      </section>
    </main>
  );
}
