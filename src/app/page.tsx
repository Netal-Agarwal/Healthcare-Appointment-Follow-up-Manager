"use client";
import React, { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) return null;
      return r.json();
    }).then((data) => {
      const role = data?.user?.role;
      if (role === "DOCTOR") window.location.href = "/doctor";
      else if (role === "ADMIN") window.location.href = "/admin";
      else if (role) window.location.href = "/patient";
    }).catch(() => null);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <section className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">Healthcare that follows through.</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">Book appointments, organize visits with AI, and receive thoughtful follow-ups and medication reminders — all in one calm, secure workspace.</p>

          <div className="flex gap-3 mt-4">
            <a href="/register" className="inline-block">
              <button className="rounded-md bg-teal-700 text-white px-5 py-3">Get Started</button>
            </a>
            <a href="/login" className="inline-block">
              <button className="rounded-md bg-transparent border border-slate-200 px-4 py-3">Login</button>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm">
              <h3 className="font-semibold">Easy booking</h3>
              <p className="text-sm text-slate-500">Find available slots and book in seconds.</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm">
              <h3 className="font-semibold">AI-assisted prep</h3>
              <p className="text-sm text-slate-500">Prepare concise pre-visit summaries automatically.</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm">
              <h3 className="font-semibold">Follow-ups</h3>
              <p className="text-sm text-slate-500">Medication reminders and post-visit notes keep care on track.</p>
            </div>
          </div>
        </section>

        <aside className="hidden lg:flex items-center justify-center">
          <div className="w-full max-w-md p-6 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 shadow-md">
            <svg viewBox="0 0 400 300" className="w-full h-60" aria-hidden>
              <rect x="10" y="10" width="380" height="280" rx="20" fill="#0F766E" opacity="0.08" />
              <circle cx="120" cy="120" r="40" fill="#0F766E" opacity="0.12" />
              <rect x="200" y="90" width="140" height="18" rx="6" fill="#0F766E" opacity="0.12" />
            </svg>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Secure, private, clinically-minded workflows for clinicians and patients.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
