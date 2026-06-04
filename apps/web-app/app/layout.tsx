"use client";

import "./globals.css";
import "@copilotkit/react-core/v2/styles.css";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { ThemeProvider } from "@/hooks/use-theme";
import { Geist, DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { SuiProviders } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";

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
            <CopilotKit
              runtimeUrl="/api/copilotkit"
              // inspectorDefaultAnchor={{ horizontal: "right", vertical: "top" }}
              useSingleEndpoint={false}
            >
              <TooltipProvider>{children}</TooltipProvider>
            </CopilotKit>
          </SuiProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
