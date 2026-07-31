"use client";

import Image from "next/image";
import InternAssistant from "./InternAssistant";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  SendHorizontal,
  FolderKanban,
  Award,
  Settings,
  Bell,
  LogOut,
  PanelLeft,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

function VibeyMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#2bb673]/15 border border-[#2bb673]/30 text-[#2bb673] font-bold ${className}`}
    >
      V
    </div>
  );
}

function getNavItems(role: string) {
  const allItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Team", path: "/team" },
    { icon: KanbanSquare, label: "Tasks", path: "/tasks" },
    { icon: SendHorizontal, label: "Contributions", path: "/contributions" },
    { icon: FolderKanban, label: "Projects", path: "/projects" },
    { icon: Award, label: "Incentives", path: "/incentives" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  if (role === "admin" || role === "founder") {
    return allItems;
  }
  return [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: KanbanSquare, label: "Tasks", path: "/tasks" },
    { icon: SendHorizontal, label: "Contributions", path: "/contributions" },
  ];
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    }
    return DEFAULT_WIDTH;
  });
  const { loading, user } = useAppAuth();
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent
        setSidebarWidth={setSidebarWidth}
        role={user.role}
        isMobile={isMobile}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  role,
  isMobile,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  role: string;
  isMobile: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppAuth();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const menuItems = getNavItems(role);
  const activeMenuItem = menuItems.find((item) => item.path === pathname);

  const roleLabel =
    role === "admin" || role === "founder"
      ? "Founder"
      : role === "team_member"
      ? "Team Member"
      : "Intern";

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, e.clientX - rect.left)
      );
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0A0A0A]">
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-[#2bb673]/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2bb673]/50 shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-[#999]" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Image src="/vibey-logo.png" alt="Vibey World" width={32} height={32} className="rounded-lg shrink-0" />
                  <span className="font-semibold tracking-tight truncate text-white text-sm">
                    Vibey Hub
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => router.push(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon
                        className={`h-4 w-4 ${
                          isActive ? "text-[#2bb673]" : "text-[#888]"
                        }`}
                      />
                      <span
                        className={isActive ? "text-[#2bb673]" : "text-[#ccc]"}
                      >
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2">
            <div className="text-[10px] text-[#555] text-center px-2 group-data-[collapsible=icon]:hidden">
              Modernizing Lives. Unlocking Potential.
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-[#2bb673]/10 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2bb673]/50">
                  <Avatar className="h-9 w-9 border border-[#2bb673]/30 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-[#2bb673]/20 text-[#2bb673]">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[11px] text-[#666] truncate mt-1.5">
                      {roleLabel}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#1a1a1a] border-[#333]"
              >
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer text-red-400 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#2bb673]/20 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="flex-1 overflow-auto">
        {(role === "intern" || role === "team_member") && <InternAssistant />}
        {isMobile && (
          <div className="flex border-b border-[#222] h-14 items-center justify-between bg-[#0A0A0A]/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-[#111]" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-white font-medium">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </div>
  );
}
