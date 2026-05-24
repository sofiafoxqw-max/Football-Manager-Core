import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Users, Building2, Store, DollarSign, Trophy, FileText, Activity, LogOut } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useGetMe({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn && location !== "/" && !location.startsWith("/sign-in") && !location.startsWith("/sign-up")) {
      setLocation("/");
    }
    if (isLoaded && isSignedIn && me) {
      if (me.role === "unregistered" && location !== "/onboarding") {
        setLocation("/onboarding");
      }
    }
  }, [isLoaded, isSignedIn, location, me, setLocation]);

  if (!isLoaded || (isSignedIn && meLoading)) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-primary font-mono">...</div></div>;
  }

  const hideSidebar = location === "/" || location.startsWith("/sign-in") || location.startsWith("/sign-up") || location === "/onboarding";

  if (hideSidebar) {
    return <div className="min-h-screen bg-background text-foreground flex flex-col">{children}</div>;
  }

  const handleSignOut = () => {
    signOut();
    queryClient.clear();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <Sidebar className="w-64 border-r border-border hidden md:flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4 border-b border-border flex items-center justify-between">
          <div className="font-bold text-xl text-primary tracking-tighter">GFC</div>
          <button onClick={handleSignOut} title="Выйти" className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto">
          <SidebarMenu className="p-2 space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/dashboard"}>
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {me?.role === "owner" && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/my-club"}>
                  <Link href="/my-club" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <Building2 className="w-4 h-4" />
                    <span>My Club</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {me?.role === "coach" && me?.clubId && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/my-club"}>
                  <Link href="/my-club" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <Building2 className="w-4 h-4" />
                    <span>Current Club</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/clubs"}>
                <Link href="/clubs" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <Activity className="w-4 h-4" />
                  <span>Clubs Market</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/players"}>
                <Link href="/players" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <Users className="w-4 h-4" />
                  <span>Players</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/transfers"}>
                <Link href="/transfers" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <Store className="w-4 h-4" />
                  <span>Transfer Market</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/economy"}>
                <Link href="/economy" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <DollarSign className="w-4 h-4" />
                  <span>Economy</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/leagues"}>
                <Link href="/leagues" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <Trophy className="w-4 h-4" />
                  <span>Leagues</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/contracts"}>
                <Link href="/contracts" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <FileText className="w-4 h-4" />
                  <span>Contracts & Offers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/leaderboard"}>
                <Link href="/leaderboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Leaderboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="p-4 border-t border-border mt-auto">
          <div className="text-xs text-muted-foreground font-mono flex items-center justify-between">
            <span className="truncate">{me?.email ?? ""}</span>
            <span className="text-primary font-bold ml-2">{me?.balance?.toLocaleString()} GFC</span>
          </div>
        </div>
      </Sidebar>
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar sticky top-0 z-10">
          <div className="font-bold text-lg text-primary tracking-tighter">GFC</div>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
