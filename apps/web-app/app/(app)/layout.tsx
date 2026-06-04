import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatProvider } from "@/components/chat-provider";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ChatProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          {/* Global mobile-only header for the sidebar trigger */}
          <header className="md:hidden flex h-14 items-center gap-2 px-4 border-b shrink-0">
            <SidebarTrigger />
            <span className="font-semibold text-sm">Open Galaxy</span>
          </header>

          {/* Main content area */}
          <main className="flex flex-1 flex-col min-h-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ChatProvider>
  );
}
