"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SearchIcon,
  CompassIcon,
  DatabaseIcon,
  BookOpenIcon,
  HistoryIcon,
  MessageSquareIcon,
  ChevronRightIcon,
  PlusIcon,
  GalleryVerticalEndIcon,
} from "lucide-react";
import { useThreads } from "@copilotkit/react-core/v2";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavUser } from "@/components/nav-user";
import { useChatContext } from "@/components/chat-provider";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { threadId, setThreadId } = useChatContext();
  const { threads } = useThreads({ agentId: "default" });

  const userData = {
    name: "Sui Researcher",
    email: "user@galaxy.com",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pt-4 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <Image
                  src="/open-galaxy-bg.png"
                  alt="Open Galaxy"
                  width={36}
                  height={36}
                  className="aspect-square size-9 rounded-lg object-cover"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Open Galaxy</span>
                  <span className="truncate text-xs">Research Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem className="mb-2 mt-2">
              <SidebarMenuButton
                onClick={() => setThreadId(undefined)}
                isActive={pathname === "/" && !threadId}
                className="w-full justify-start border border-border bg-background shadow-xs hover:bg-muted"
              >
                <PlusIcon className="size-4 text-muted-foreground" />
                <span className="font-medium">New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Galaxy Search">
                <SearchIcon />
                <span>Galaxy Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible asChild className="group/explore">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Explore">
                    <CompassIcon />
                    <span>Explore</span>
                    <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/explore:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link href="/explore/library">
                          <BookOpenIcon className="size-3.5" />
                          <span>Library</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>
                        <GalleryVerticalEndIcon className="size-3.5" />
                        <span>Scholars</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>
                        <DatabaseIcon className="size-3.5" />
                        <span>Datasets</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Memories">
                <GalleryVerticalEndIcon />
                <span>Memories</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Projects">
                <BookOpenIcon />
                <span>Projects</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <Collapsible asChild defaultOpen className="group/history">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="History">
                    <HistoryIcon />
                    <span>History</span>
                    <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/history:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {threads?.length === 0 ? (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="text-muted-foreground/40 text-xs cursor-default"
                        >
                          <button disabled>
                            <span>Empty history</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ) : (
                      threads?.map((thread) => (
                        <SidebarMenuSubItem key={thread.id}>
                          <SidebarMenuSubButton
                            isActive={thread.id === threadId}
                            onClick={() => setThreadId(thread.id)}
                            className="w-full justify-start text-xs cursor-pointer"
                          >
                            <MessageSquareIcon className="size-3.5 text-muted-foreground" />
                            <span className="truncate">
                              {thread.name || "Untitled Chat"}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
