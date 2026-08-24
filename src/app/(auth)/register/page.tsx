"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.status === 409) {
        setError("An account with this email already exists.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/auth/login");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex items-center justify-center bg-gradient-to-br from-teal-700 to-teal-600 text-white p-12">
        <div className="max-w-md">
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect width="160" height="160" rx="24" fill="#064E46" />
            <path d="M40 80h80M80 40v80" stroke="#CFFAFE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="mt-6 text-2xl font-semibold">Join HealthFollow</h2>
          <p className="mt-2 text-slate-100">Register as a patient to book appointments and get follow-ups.</p>
        </div>
      </section>

      <main className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Patient registration only.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            <label className="block">
              <span className="text-sm">Full name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label className="block">
              <span className="text-sm">Email</span>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>

            <label className="block">
              <span className="text-sm">Password</span>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} />
            </label>

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
              <a href="/auth/login" className="text-sm text-teal-700">Already have an account?</a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
