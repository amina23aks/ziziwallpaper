"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/_providers/auth-provider";
import { ThemeProvider } from "@/app/_providers/theme-provider";
import { ThemeToggle } from "@/app/_components/theme-toggle";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <ThemeToggle />
      </AuthProvider>
    </ThemeProvider>
  );
}
