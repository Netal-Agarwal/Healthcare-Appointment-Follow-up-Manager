"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Invalid credentials. Please check your email and password.");
      return;
    }
    const data = await res.json();
    const role = data?.user?.role;
    if (role === "DOCTOR") router.push("/doctor");
    else if (role === "ADMIN") router.push("/admin");
    else router.push("/patient");
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex items-center justify-center bg-teal-700 text-white p-12">
        <div className="max-w-md">
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect width="160" height="160" rx="24" fill="#0F766E" />
            <path d="M40 80h80M80 40v80" stroke="#CFFAFE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="mt-6 text-2xl font-semibold">Care, simplified.</h2>
          <p className="mt-2 text-slate-100">Book appointments, prepare for visits, and receive follow-ups — all in one calm place.</p>
        </div>
      </section>

      <main className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold">Sign in to your account</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your credentials to continue.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            <label className="block">
              <span className="text-sm">Email</span>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>

            <label className="block">
              <span className="text-sm">Password</span>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
              <a href="/register" className="text-sm text-teal-700">Create account</a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
