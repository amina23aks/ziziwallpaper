import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/app/_providers/app-providers";

export const metadata: Metadata = {
  title: "Zizi Wallpaper",
  description: "Mood-based wallpaper gallery for focus, energy, sleep, and achievement.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-[var(--app-bg)] text-[var(--app-text)]">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('zizi-theme');var isDark=t==='dark';d.classList.toggle('dark',isDark);d.style.colorScheme=isDark?'dark':'light';}catch(e){}})();`,
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
