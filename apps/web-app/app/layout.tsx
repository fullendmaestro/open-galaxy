"use client";

import "./globals.css";
import "@copilotkit/react-core/v2/styles.css";

import dynamic from "next/dynamic";
import { ThemeProvider } from "@/hooks/use-theme";
import { Geist, DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const SuiProviders = dynamic(
  () => import("@/components/providers").then((mod) => mod.SuiProviders),
  { ssr: false },
);

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", dmSans.variable)}>
      <head>
        <title>Open Galaxy</title>
        <link rel="icon" type="image/svg+xml" href="/open-galaxy.png" />
      </head>
      <body className={`antialiased`}>
        <ThemeProvider>
          <SuiProviders>
            <TooltipProvider>{children}</TooltipProvider>
          </SuiProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
