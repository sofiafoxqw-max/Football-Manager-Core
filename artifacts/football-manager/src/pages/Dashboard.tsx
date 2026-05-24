import { useGetGameState, useGetFinances, useListFixtures, useAdvanceGame, useGetLeagueStandings, getGetGameStateQueryKey, getListFixturesQueryKey, getGetFinancesQueryKey, getGetLeagueStandingsQueryKey, getGetSquadQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { CalendarDays, Trophy, DollarSign, Activity, ChevronRight, ArrowRight, AlertTriangle } from "lucide-react";

function FormBadge({ result }: { result: string }) {
  const cls = result === "W" ? "form-W" : result === "D" ? "form-D" : "form-L";
  return <span className={`fm-badge ${cls} text-xs`} style={{ padding: "1px 5px", borderRadius: "2px" }}>{result}</span>;
}

function StatCard({ label, value, sub, color, icon: Icon, href }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: any; href?: string;
}) {
  const content = (
    <div className="fm-card p-3 hover:border-opacity-80 transition-all" style={{ cursor: href ? "pointer" : "default" }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold" style={{ color: "var(--fm-muted)" }}>{label}</div>
          <div className="text-2xl font-bold mt-1" style={{ color: color ?? "var(--fm-text)" }}>{value}</div>
          {sub && <div className="text-xs mt-0.5" style={{ color: "var(--fm-muted)" }}>{sub}</div>}
        </div>
        {Icon && <Icon className="w-4 h-4 mt-0.5" style={{ color: "var(--fm-muted)" }} />}
      </div>
      {href && <div className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--fm-accent)" }}>View <ChevronRight className="w-3 h-3" /></div>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const { data: gameState } = useGetGameState();
  const { data: finances } = useGetFinances();
  const { data: fixtures } = useListFixtures();
  const { data: league } = useGetLeagueStandings();
  const advanceGame = useAdvanceGame();
  const qc = useQueryClient();

  const handleAdvance = () => {
    advanceGame.mutate(undefined, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
        qc.invalidateQueries({ queryKey: getListFixturesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetFinancesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetLeagueStandingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSquadQueryKey() });
      }
    });
  };

  const upcomingFixtures = fixtures?.filter(f => f.status === "scheduled").slice(0, 5) ?? [];
  const recentResults = fixtures?.filter(f => f.status === "completed").slice(-5).reverse() ?? [];
  const myStanding = league?.standings?.find(s => s.isPlayerClub);

  if (!gameState) return <div className="flex items-center justify-center h-full" style={{ color: "var(--fm-muted)" }}>Loading...</div>;

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header bar */}
      <div className="p-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
        <div>
          <div className="text-lg font-bold" style={{ color: "var(--fm-text)" }}>{gameState.clubName}</div>
          <div className="text-xs" style={{ color: "var(--fm-muted)" }}>
            {gameState.leagueName} • Season {gameState.season} • Week {gameState.currentWeek}/{gameState.totalWeeks}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {gameState.injuredCount ? (
            <div className="flex items-center gap-1 text-xs" style={{ color: "#f87171" }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {gameState.injuredCount} injured
            </div>
          ) : null}
          <button onClick={handleAdvance} disabled={advanceGame.isPending}
            className="fm-btn fm-btn-primary px-5"
            style={{ fontSize: "13px" }}>
            {advanceGame.isPending ? "Simulating..." : "Advance Week →"}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="LEAGUE POSITION" value={gameState.leaguePosition ? `${gameState.leaguePosition}${["st","nd","rd"][gameState.leaguePosition-1] ?? "th"}` : "-"}
            sub={`${myStanding?.points ?? 0} pts • ${myStanding?.played ?? 0} played`} color="var(--fm-accent)" icon={Trophy} href="/league" />
          <StatCard label="TRANSFER BUDGET" value={`£${((gameState.transferBudget ?? 0)).toLocaleString()}k`}
            sub="Available to spend" color="#34d399" icon={DollarSign} href="/finances" />
          <StatCard label="NEXT MATCH" value={gameState.nextFixtureOpponent ?? "None scheduled"}
            sub={`${gameState.nextFixtureIsHome ? "Home" : "Away"} • ${gameState.nextFixtureDate ?? ""}`} icon={CalendarDays} href="/fixtures" />
          <StatCard label="TEAM MORALE" value={gameState.morale ?? "good"} sub="Squad mood" color={
            gameState.morale === "excellent" ? "#10b981" : gameState.morale === "good" ? "#34d399" : gameState.morale === "okay" ? "#f59e0b" : "#ef4444"
          } icon={Activity} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Recent Results */}
          <div className="fm-panel">
            <div className="fm-section-header">Recent Results</div>
            <div className="divide-y" style={{ borderColor: "var(--fm-border)" }}>
              {recentResults.length === 0 && <div className="p-4 text-xs text-center" style={{ color: "var(--fm-muted)" }}>No results yet</div>}
              {recentResults.map(f => {
                const isHome = f.isPlayerClubHome;
                const isAway = f.isPlayerClubAway;
                const myScore = isHome ? f.homeScore! : f.awayScore!;
                const oppScore = isHome ? f.awayScore! : f.homeScore!;
                const result = myScore > oppScore ? "W" : myScore < oppScore ? "L" : "D";
                return (
                  <div key={f.id} className="flex items-center gap-2 p-2 text-xs">
                    <FormBadge result={result} />
                    <span style={{ color: "var(--fm-muted)" }}>Wk{f.week}</span>
                    <span className="flex-1 truncate" style={{ color: "var(--fm-text)" }}>
                      {isHome ? f.homeClubName : f.awayClubName}
                    </span>
                    <span className="font-mono font-bold" style={{ color: "var(--fm-text)" }}>{myScore}-{oppScore}</span>
                    <span className="truncate" style={{ color: "var(--fm-muted)" }}>
                      {isHome ? f.awayClubName : f.homeClubName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Fixtures */}
          <div className="fm-panel">
            <div className="fm-section-header">
              Upcoming Fixtures
              <Link href="/fixtures" className="ml-auto text-xs" style={{ color: "var(--fm-accent)" }}>All <ArrowRight className="inline w-3 h-3" /></Link>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--fm-border)" }}>
              {upcomingFixtures.length === 0 && <div className="p-4 text-xs text-center" style={{ color: "var(--fm-muted)" }}>Season complete</div>}
              {upcomingFixtures.map(f => {
                const isHome = f.isPlayerClubHome;
                const isAway = f.isPlayerClubAway;
                const isMyMatch = isHome || isAway;
                return (
                  <div key={f.id} className="flex items-center gap-2 p-2 text-xs" style={{ opacity: isMyMatch ? 1 : 0.6 }}>
                    <span className="w-6 font-mono" style={{ color: "var(--fm-muted)" }}>W{f.week}</span>
                    <span className="flex-1 truncate" style={{ color: isHome ? "var(--fm-accent)" : "var(--fm-text)" }}>{f.homeClubName}</span>
                    <span style={{ color: "var(--fm-muted)" }}>vs</span>
                    <span className="flex-1 truncate" style={{ color: isAway ? "var(--fm-accent)" : "var(--fm-text)" }}>{f.awayClubName}</span>
                    {isMyMatch && (
                      <Link href={`/fixtures/${f.id}/match`}>
                        <span className="fm-badge" style={{ background: "var(--fm-accent)", color: "#fff", fontSize: "9px" }}>PLAY</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* League snapshot */}
          <div className="fm-panel">
            <div className="fm-section-header">
              League Table
              <Link href="/league" className="ml-auto text-xs" style={{ color: "var(--fm-accent)" }}>Full <ArrowRight className="inline w-3 h-3" /></Link>
            </div>
            <table className="fm-table compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Club</th>
                  <th>P</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {league?.standings?.slice(0, 8).map(s => (
                  <tr key={s.clubId} style={{ background: s.isPlayerClub ? "var(--fm-active-bg)" : undefined }}>
                    <td style={{ color: s.position <= 4 ? "#3b82f6" : s.position >= 18 ? "#ef4444" : "var(--fm-muted)", fontWeight: "600" }}>{s.position}</td>
                    <td style={{ color: s.isPlayerClub ? "var(--fm-accent)" : "var(--fm-text)", fontWeight: s.isPlayerClub ? "600" : "400" }}>
                      {s.clubName.split(" ").slice(-1)[0]}
                    </td>
                    <td style={{ color: "var(--fm-muted)" }}>{s.played}</td>
                    <td style={{ color: s.isPlayerClub ? "var(--fm-accent)" : "var(--fm-text)", fontWeight: "600" }}>{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Finances row */}
        {finances && (
          <div className="fm-panel">
            <div className="fm-section-header">Financial Overview</div>
            <div className="grid grid-cols-5 divide-x p-0" style={{ borderColor: "var(--fm-border)" }}>
              {[
                { label: "Transfer Budget", value: `£${(finances.transferBudget ?? 0).toLocaleString()}k`, color: "#34d399" },
                { label: "Wage Budget", value: `£${(finances.wageBudget ?? 0).toLocaleString()}k pw`, color: "var(--fm-text)" },
                { label: "Current Wages", value: `£${(finances.currentWeeklyWages ?? 0).toLocaleString()}k pw`, color: finances.currentWeeklyWages > finances.wageBudget ? "#ef4444" : "var(--fm-muted)" },
                { label: "Season Revenue", value: `£${(finances.seasonRevenue ?? 0).toLocaleString()}k`, color: "#34d399" },
                { label: "Prize Money (Est.)", value: `£${(finances.prizeMoneyEstimate ?? 0).toLocaleString()}k`, color: "#60a5fa" },
              ].map(item => (
                <div key={item.label} className="p-3">
                  <div className="text-xs" style={{ color: "var(--fm-muted)" }}>{item.label}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
