"use client";
import React from "react";

export default function Sidebar({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  const items = [
    { label: "Home", href: "/" },
    { label: "Patient area", href: "/patient" },
    { label: "Doctor area", href: "/doctor" },
    { label: "Administration", href: "/admin" },
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
