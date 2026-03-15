"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/_providers/auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
