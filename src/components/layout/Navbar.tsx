"use client";
import React from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between gap-4 px-6 py-3 bg-transparent">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-teal-700" />
        <div>
          <div className="text-sm font-semibold">HealthFollow</div>
          <div className="text-xs text-slate-500">Appointment & Follow-up</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {session?.user ? (
          <div className="flex items-center gap-3">
            <div className="text-sm">{session.user.name}</div>
            <Button variant="ghost" onClick={() => signOut()}>
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="/auth/login">
              <Button variant="secondary">Login</Button>
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
