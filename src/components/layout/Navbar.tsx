"use client";
import React from "react";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { Cross, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: "PATIENT" | "DOCTOR" | "ADMIN" } | null>(null);
  useEffect(() => { fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((data) => setUser(data?.user ?? null)).catch(() => setUser(null)); }, []);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.assign("/auth/login"); }

  return (
    <nav className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 md:px-10">
      <div className="flex items-center gap-8">
        <a href="/" className="flex items-center gap-2 text-[28px] font-bold tracking-tight text-[#091426]"><span className="grid h-7 w-7 place-items-center rounded border-2 border-[#006398] text-[#006398]"><Cross className="h-4 w-4" strokeWidth={3}/></span>HealthFollow</a>
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <a href="/patient/doctors" className="hover:text-[#006398]">Patients</a><a href="/doctor" className="hover:text-[#006398]">Doctors</a><a href="/admin" className="hover:text-[#006398]">Enterprise</a>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <a className="hidden items-center gap-2 text-sm font-semibold text-slate-700 sm:flex" href={user.role === "PATIENT" ? "/patient" : user.role === "DOCTOR" ? "/doctor" : "/admin"}><LayoutDashboard className="h-4 w-4 text-[#006398]" />{user.name}</a>
            <Button variant="ghost" onClick={logout}>
              Log out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="/auth/login">
              <span className="text-sm font-semibold">Log In</span>
            </a>
            <a href="/auth/register">
              <Button>Get Started</Button>
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
