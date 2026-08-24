"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes resolves system preference only in the browser. Rendering an
  // icon before mount can make the server and client SVG trees differ.
  useEffect(() => setMounted(true), []);

  const current = resolvedTheme || theme;

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => mounted && setTheme(current === "dark" ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
    >
      {mounted ? (current === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : <span className="h-5 w-5" aria-hidden />}
    </button>
  );
}
