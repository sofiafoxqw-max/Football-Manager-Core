import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, Users, Target, CalendarDays, Trophy,
  ArrowRightLeft, Inbox, DollarSign, Dumbbell, Search,
  FileText, UserCog, Crosshair, Mic, Newspaper, ChevronRight
} from "lucide-react";
import { useGetGameState } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "CLUB",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Inbox", url: "/inbox", icon: Inbox, badge: true },
      { title: "Finances", url: "/finances", icon: DollarSign },
    ]
  },
  {
    label: "TEAM",
    items: [
      { title: "Squad", url: "/squad", icon: Users },
      { title: "Tactics", url: "/tactics", icon: Target },
      { title: "Training", url: "/training", icon: Dumbbell },
      { title: "Staff", url: "/staff", icon: UserCog },
    ]
  },
  {
    label: "COMPETITION",
    items: [
      { title: "Fixtures", url: "/fixtures", icon: CalendarDays },
      { title: "League", url: "/league", icon: Trophy },
      { title: "Set Pieces", url: "/set-pieces", icon: Crosshair },
    ]
  },
  {
    label: "TRANSFERS",
    items: [
      { title: "Transfer Market", url: "/transfers", icon: ArrowRightLeft },
      { title: "Scouting", url: "/scouting", icon: Search },
      { title: "Contracts", url: "/contracts", icon: FileText },
    ]
  },
  {
    label: "MEDIA",
    items: [
      { title: "Press Conf.", url: "/press-conference", icon: Mic },
    ]
  }
];

const moraleColors: Record<string, string> = {
  excellent: "text-emerald-400",
  good: "text-green-400",
  okay: "text-yellow-400",
  poor: "text-red-400",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: gameState } = useGetGameState();

  const ordinal = (n: number) => {
    const s = ["th","st","nd","rd"];
    const v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--fm-bg)", color: "var(--fm-text)" }}>
      {/* Left Sidebar */}
      <aside className="w-52 flex flex-col border-r shrink-0" style={{ background: "var(--fm-sidebar)", borderColor: "var(--fm-border)" }}>
        {/* Logo */}
        <div className="h-12 flex items-center px-4 border-b shrink-0" style={{ borderColor: "var(--fm-border)", background: "var(--fm-header)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs" style={{ background: "var(--fm-accent)" }}>FM</div>
            <span className="font-bold text-sm tracking-wider" style={{ color: "var(--fm-text)" }}>FOOTBALL MGR</span>
          </div>
        </div>

        {/* Club info */}
        {gameState?.started && (
          <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
            <div className="text-xs font-bold truncate" style={{ color: "var(--fm-text)" }}>{gameState.clubName}</div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs" style={{ color: "var(--fm-muted)" }}>{gameState.leagueName}</span>
              {gameState.leaguePosition && (
                <span className="text-xs font-semibold" style={{ color: "var(--fm-accent)" }}>{ordinal(gameState.leaguePosition)}</span>
              )}
            </div>
          </div>
        )}

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-1 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.label} className="mb-1">
              <div className="px-3 pt-2 pb-0.5 text-[10px] font-semibold tracking-widest" style={{ color: "var(--fm-muted)" }}>
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = location === item.url;
                return (
                  <Link key={item.url} href={item.url}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 text-sm cursor-pointer transition-all group relative",
                      isActive
                        ? "font-semibold"
                        : "hover:opacity-90"
                    )}
                    style={{
                      background: isActive ? "var(--fm-active-bg)" : undefined,
                      color: isActive ? "var(--fm-accent)" : "var(--fm-nav-text)",
                      borderLeft: isActive ? "2px solid var(--fm-accent)" : "2px solid transparent",
                    }}>
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && gameState?.unreadMessages ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--fm-accent)", color: "#fff" }}>
                          {gameState.unreadMessages}
                        </span>
                      ) : null}
                      {isActive && <ChevronRight className="w-3 h-3 shrink-0" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom status */}
        {gameState?.started && (
          <div className="px-3 py-2 border-t text-[10px] space-y-0.5" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
            <div className="flex justify-between">
              <span style={{ color: "var(--fm-muted)" }}>Date</span>
              <span style={{ color: "var(--fm-text)" }}>{gameState.currentDate}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--fm-muted)" }}>Week</span>
              <span style={{ color: "var(--fm-text)" }}>{gameState.currentWeek}/{gameState.totalWeeks}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--fm-muted)" }}>Morale</span>
              <span className={moraleColors[gameState.morale ?? "good"] ?? "text-green-400"} style={{ textTransform: "capitalize" }}>{gameState.morale}</span>
            </div>
            {gameState.injuredCount ? (
              <div className="flex justify-between">
                <span style={{ color: "var(--fm-muted)" }}>Injured</span>
                <span style={{ color: "#f87171" }}>{gameState.injuredCount}</span>
              </div>
            ) : null}
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 flex items-center justify-between px-4 shrink-0 border-b" style={{ background: "var(--fm-header)", borderColor: "var(--fm-border)" }}>
          <div className="flex items-center gap-4">
            {gameState?.started && (
              <>
                <div className="text-xs" style={{ color: "var(--fm-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--fm-text)" }}>{gameState.currentDate}</span>
                  <span className="ml-1">• Season {gameState.season}</span>
                </div>
                {gameState.nextFixtureOpponent && (
                  <div className="text-xs px-2 py-1 rounded" style={{ background: "var(--fm-panel)", border: "1px solid var(--fm-border)" }}>
                    <span style={{ color: "var(--fm-muted)" }}>Next: </span>
                    <span style={{ color: "var(--fm-text)" }}>
                      {gameState.nextFixtureIsHome ? "vs" : "@"} {gameState.nextFixtureOpponent}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {gameState?.started && (
              <>
                <div className="text-xs" style={{ color: "var(--fm-muted)" }}>
                  Budget: <span className="font-semibold" style={{ color: "#34d399" }}>£{((gameState.transferBudget ?? 0)).toLocaleString()}k</span>
                </div>
                <div className="text-xs" style={{ color: "var(--fm-muted)" }}>
                  {gameState.managerName}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--fm-bg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
