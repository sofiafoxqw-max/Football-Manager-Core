import { useLocation } from "wouter";
import { Link } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Calendar, Users, Target, CalendarDays, Trophy, ArrowRightLeft, Inbox, DollarSign } from "lucide-react";
import { useGetGameState } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Calendar },
  { title: "Squad", url: "/squad", icon: Users },
  { title: "Tactics", url: "/tactics", icon: Target },
  { title: "Fixtures", url: "/fixtures", icon: CalendarDays },
  { title: "League", url: "/league", icon: Trophy },
  { title: "Transfers", url: "/transfers", icon: ArrowRightLeft },
  { title: "Inbox", url: "/inbox", icon: Inbox },
  { title: "Finances", url: "/finances", icon: DollarSign },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: gameState } = useGetGameState();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
        <Sidebar className="border-r border-border">
          <SidebarContent>
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="font-bold text-lg tracking-tight">FM 2025</div>
              <SidebarTrigger />
            </div>
            
            {gameState?.started && (
              <div className="p-4 border-b border-border bg-card/50">
                <div className="text-sm font-medium text-primary">{gameState.clubName}</div>
                <div className="text-xs text-muted-foreground mt-1">Week {gameState.currentWeek} • {gameState.currentDate}</div>
              </div>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.title === "Inbox" && gameState?.unreadMessages ? (
                              <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                {gameState.unreadMessages}
                              </span>
                            ) : null}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
