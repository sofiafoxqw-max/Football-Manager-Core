import { useListFixtures } from "@workspace/api-client-react";
import { Link } from "wouter";
import { CalendarDays, Play, CheckCircle } from "lucide-react";

function ResultBadge({ home, away, isHome, isAway }: { home: number; away: number; isHome: boolean; isAway: boolean }) {
  if (!isHome && !isAway) return null;
  const my = isHome ? home : away;
  const opp = isHome ? away : home;
  const result = my > opp ? "W" : my < opp ? "L" : "D";
  const colors = { W: { bg: "#10b98122", text: "#10b981" }, D: { bg: "#f59e0b22", text: "#f59e0b" }, L: { bg: "#ef444422", text: "#ef4444" } };
  return (
    <span className="fm-badge" style={{ background: colors[result].bg, color: colors[result].text, minWidth: 20, justifyContent: "center" }}>
      {result}
    </span>
  );
}

export default function Fixtures() {
  const { data: fixtures, isLoading } = useListFixtures();

  if (isLoading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>Loading fixtures...</div>;

  const grouped: Record<number, typeof fixtures> = {};
  fixtures?.forEach(f => {
    if (!grouped[f.week]) grouped[f.week] = [];
    grouped[f.week]!.push(f);
  });

  const weeks = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const myFixtures = fixtures?.filter(f => f.isPlayerClubHome || f.isPlayerClubAway) ?? [];
  const results = myFixtures.filter(f => f.status === "completed");
  const wins = results.filter(f => {
    const my = f.isPlayerClubHome ? f.homeScore! : f.awayScore!;
    const opp = f.isPlayerClubHome ? f.awayScore! : f.homeScore!;
    return my > opp;
  }).length;
  const draws = results.filter(f => {
    const my = f.isPlayerClubHome ? f.homeScore! : f.awayScore!;
    const opp = f.isPlayerClubHome ? f.awayScore! : f.homeScore!;
    return my === opp;
  }).length;
  const losses = results.length - wins - draws;

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <CalendarDays className="w-3.5 h-3.5" />
        Fixtures & Results
        {results.length > 0 && (
          <div className="ml-4 flex items-center gap-3 text-xs">
            <span style={{ color: "#10b981" }}>{wins}W</span>
            <span style={{ color: "#f59e0b" }}>{draws}D</span>
            <span style={{ color: "#ef4444" }}>{losses}L</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {weeks.map(week => (
            <div key={week} className="fm-panel">
              <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: "var(--fm-border)" }}>
                <span className="fm-badge" style={{ background: "var(--fm-header)", color: "var(--fm-muted)", fontSize: "10px" }}>WEEK {week}</span>
              </div>
              <table className="fm-table">
                <tbody>
                  {grouped[week]?.map(f => {
                    const isMyMatch = f.isPlayerClubHome || f.isPlayerClubAway;
                    const isCompleted = f.status === "completed";
                    return (
                      <tr key={f.id} style={{ opacity: isMyMatch ? 1 : 0.7 }}>
                        <td style={{ width: 80, color: "var(--fm-muted)", fontSize: "11px" }}>{f.date}</td>
                        <td style={{ width: 24 }}>
                          {isMyMatch && isCompleted && (
                            <ResultBadge home={f.homeScore!} away={f.awayScore!} isHome={!!f.isPlayerClubHome} isAway={!!f.isPlayerClubAway} />
                          )}
                        </td>
                        <td style={{ textAlign: "right", color: f.isPlayerClubHome ? "var(--fm-accent)" : "var(--fm-text)", fontWeight: f.isPlayerClubHome ? "600" : "400" }}>
                          {f.homeClubName}
                        </td>
                        <td style={{ width: 80, textAlign: "center" }}>
                          {isCompleted ? (
                            <span className="font-mono font-bold text-sm" style={{ color: "var(--fm-text)" }}>
                              {f.homeScore} — {f.awayScore}
                            </span>
                          ) : (
                            <span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)", fontSize: "10px" }}>vs</span>
                          )}
                        </td>
                        <td style={{ color: f.isPlayerClubAway ? "var(--fm-accent)" : "var(--fm-text)", fontWeight: f.isPlayerClubAway ? "600" : "400" }}>
                          {f.awayClubName}
                        </td>
                        <td style={{ width: 80, textAlign: "right" }}>
                          {isMyMatch && !isCompleted && (
                            <Link href={`/fixtures/${f.id}/match`}>
                              <button className="fm-btn fm-btn-primary" style={{ padding: "2px 10px", fontSize: "11px" }}>
                                <Play className="w-3 h-3" /> Play
                              </button>
                            </Link>
                          )}
                          {isMyMatch && isCompleted && (
                            <Link href={`/fixtures/${f.id}/match`}>
                              <button className="fm-btn fm-btn-secondary" style={{ padding: "2px 10px", fontSize: "11px" }}>
                                <CheckCircle className="w-3 h-3" /> Review
                              </button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
          {!weeks.length && (
            <div className="fm-panel p-8 text-center" style={{ color: "var(--fm-muted)" }}>No fixtures scheduled.</div>
          )}
        </div>
      </div>
    </div>
  );
}
