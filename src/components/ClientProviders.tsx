"use client";
import React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
