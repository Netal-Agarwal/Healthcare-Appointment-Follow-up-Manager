"use client";
import React from "react";
import { useSession } from "next-auth/react";

export default function Sidebar({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  const { data: session } = useSession();

  const role = session?.user?.role;

  const items = [
    { label: "Dashboard", href: "/" },
    ...(role === "DOCTOR" ? [{ label: "My Schedule", href: "/doctor" }] : []),
    ...(role === "ADMIN" ? [{ label: "Manage Doctors", href: "/admin/doctors" }] : []),
    ...(role === "PATIENT" ? [{ label: "My Appointments", href: "/appointments" }] : []),
  ];

  return (
    <aside className={["w-64 shrink-0 p-4", className].filter(Boolean).join(" ")}>
      <div className="space-y-4">
        {items.map((it) => (
          <a key={it.href} href={it.href} className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
            {it.label}
          </a>
        ))}
      </div>
      <div className="mt-6">{children}</div>
    </aside>
  );
}
