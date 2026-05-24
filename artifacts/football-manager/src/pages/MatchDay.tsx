import { useParams, useLocation } from "wouter";
import { useGetLiveMatch, useSimulateMatch, useGetFixture } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, ArrowLeft, Activity } from "lucide-react";

const commentaryColors: Record<string, string> = {
  goal: "#f59e0b",
  card: "#ef4444",
  substitution: "#8b5cf6",
  chance: "#3b82f6",
  kickoff: "#10b981",
  halftime: "#6b7280",
  fulltime: "#10b981",
  general: "var(--fm-muted)",
};

const commentaryIcons: Record<string, string> = {
  goal: "⚽",
  card: "🟡",
  substitution: "🔄",
  kickoff: "▶",
  halftime: "⌛",
  fulltime: "🏁",
  general: "•",
  chance: "→",
};

export default function MatchDay() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = Number(params.id);
  const qc = useQueryClient();

  const { data: fixture, refetch: refetchFixture } = useGetFixture(id);
  const { data: live, refetch: refetchLive } = useGetLiveMatch(id);
  const simulate = useSimulateMatch();
  const [simulating, setSimulating] = useState(false);
  const [showRatings, setShowRatings] = useState(false);

  const handleSimulate = async () => {
    setSimulating(true);
    await simulate.mutateAsync({ id });
    await refetchFixture();
    await refetchLive();
    qc.invalidateQueries({ queryKey: ["getGameState"] });
    qc.invalidateQueries({ queryKey: ["listFixtures"] });
    qc.invalidateQueries({ queryKey: ["getLeagueStandings"] });
    setSimulating(false);
  };

  if (!fixture || !live) return (
    <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>Loading match...</div>
  );

  const isCompleted = fixture.status === "completed";
  const homeScore = live.homeScore ?? 0;
  const awayScore = live.awayScore ?? 0;

  const playerWon = fixture.isPlayerClubHome ? homeScore > awayScore : awayScore > homeScore;
  const playerDrew = homeScore === awayScore;
  const resultColor = playerWon ? "#10b981" : playerDrew ? "#f59e0b" : "#ef4444";

  const commentary = (live.commentary ?? []) as Array<{ minute: number; text: string; type: string }>;
  const events = (live.events ?? []) as Array<{ minute: number; type: string; playerName: string; clubId: number }>;

  const playerClubId = fixture.isPlayerClubHome ? fixture.homeClubId : fixture.awayClubId;

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <button onClick={() => setLocation("/fixtures")} className="fm-btn" style={{ background: "transparent", color: "var(--fm-muted)", padding: "0 4px" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Activity className="w-3.5 h-3.5" />
        Match Day
        <span className="text-xs" style={{ color: "var(--fm-muted)" }}>Week {fixture.week} • {fixture.date}</span>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left: Match info */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scoreboard */}
          <div className="p-6 text-center border-b" style={{ background: "var(--fm-panel)", borderColor: "var(--fm-border)" }}>
            <div className="text-xs mb-3" style={{ color: "var(--fm-muted)" }}>PREMIER LEAGUE • WEEK {fixture.week}</div>
            <div className="flex items-center justify-center gap-8">
              <div className="flex-1 text-right">
                <div className={`text-xl font-bold ${fixture.isPlayerClubHome ? "" : ""}`} style={{ color: fixture.isPlayerClubHome ? "var(--fm-accent)" : "var(--fm-text)" }}>
                  {fixture.homeClubName}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--fm-muted)" }}>HOME</div>
              </div>
              <div className="text-center">
                {isCompleted ? (
                  <div>
                    <div className="text-5xl font-bold font-mono" style={{ color: "var(--fm-text)", letterSpacing: "0.05em" }}>
                      {homeScore} <span style={{ color: "var(--fm-muted)" }}>—</span> {awayScore}
                    </div>
                    <div className="text-sm font-semibold mt-2" style={{ color: resultColor }}>
                      {(fixture.isPlayerClubHome || fixture.isPlayerClubAway) ? (playerWon ? "VICTORY" : playerDrew ? "DRAW" : "DEFEAT") : "FULL TIME"}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold px-6 py-2 rounded" style={{ background: "var(--fm-card)", color: "var(--fm-muted)" }}>
                      vs
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--fm-muted)" }}>{fixture.date}</div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold" style={{ color: fixture.isPlayerClubAway ? "var(--fm-accent)" : "var(--fm-text)" }}>
                  {fixture.awayClubName}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--fm-muted)" }}>AWAY</div>
              </div>
            </div>

            {!isCompleted && (fixture.isPlayerClubHome || fixture.isPlayerClubAway) && (
              <button className="fm-btn fm-btn-primary mt-4 px-8 py-2 text-base" onClick={handleSimulate} disabled={simulating}>
                <Play className="w-4 h-4" />
                {simulating ? "Simulating..." : "Play Match"}
              </button>
            )}
          </div>

          {/* Stats */}
          {isCompleted && fixture.stats && (
            <div className="p-4 border-b" style={{ borderColor: "var(--fm-border)", background: "var(--fm-card)" }}>
              <div className="text-xs font-semibold mb-3" style={{ color: "var(--fm-muted)" }}>MATCH STATISTICS</div>
              <div className="space-y-2">
                {[
                  { label: "Possession", home: fixture.stats.homePossession, away: fixture.stats.awayPossession, pct: true },
                  { label: "Shots", home: fixture.stats.homeShots, away: fixture.stats.awayShots },
                  { label: "Shots on Target", home: fixture.stats.homeShotsOnTarget, away: fixture.stats.awayShotsOnTarget },
                  { label: "Corners", home: fixture.stats.homeCorners, away: fixture.stats.awayCorners },
                  { label: "Yellow Cards", home: fixture.stats.homeYellowCards ?? 0, away: fixture.stats.awayYellowCards ?? 0 },
                ].map(stat => {
                  const total = stat.home + stat.away || 1;
                  const homePct = (stat.home / total) * 100;
                  return (
                    <div key={stat.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: fixture.isPlayerClubHome ? "var(--fm-accent)" : "var(--fm-text)" }}>{stat.home}{stat.pct ? "%" : ""}</span>
                        <span style={{ color: "var(--fm-muted)" }}>{stat.label}</span>
                        <span style={{ color: fixture.isPlayerClubAway ? "var(--fm-accent)" : "var(--fm-text)" }}>{stat.away}{stat.pct ? "%" : ""}</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background: "var(--fm-border)" }}>
                        <div style={{ width: `${homePct}%`, background: fixture.isPlayerClubHome ? "var(--fm-accent)" : "#6b7280", borderRadius: "2px 0 0 2px" }} />
                        <div style={{ flex: 1, background: fixture.isPlayerClubAway ? "var(--fm-accent)" : "#6b7280", borderRadius: "0 2px 2px 0" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Player ratings toggle */}
          {isCompleted && fixture.playerRatings && fixture.playerRatings.length > 0 && (
            <div className="border-b" style={{ borderColor: "var(--fm-border)" }}>
              <button className="w-full p-2 text-left text-xs font-semibold flex items-center justify-between" style={{ color: "var(--fm-muted)", background: "var(--fm-panel)" }}
                onClick={() => setShowRatings(r => !r)}>
                PLAYER RATINGS
                <span>{showRatings ? "▲" : "▼"}</span>
              </button>
              {showRatings && (
                <div className="overflow-auto" style={{ background: "var(--fm-card)" }}>
                  <table className="fm-table compact">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Pos</th>
                        <th>Rating</th>
                        <th>Goals</th>
                        <th>Assists</th>
                        <th>YC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixture.playerRatings.map((r: any) => (
                        <tr key={r.playerId}>
                          <td style={{ color: "var(--fm-text)" }}>{r.playerName}</td>
                          <td><span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)" }}>{r.position}</span></td>
                          <td>
                            <span className="fm-badge" style={{
                              background: r.rating >= 8 ? "#f59e0b22" : r.rating >= 7 ? "#10b98122" : r.rating >= 6 ? "#3b82f622" : "#ef444422",
                              color: r.rating >= 8 ? "#f59e0b" : r.rating >= 7 ? "#10b981" : r.rating >= 6 ? "#60a5fa" : "#f87171",
                            }}>
                              {r.rating.toFixed(1)}
                            </span>
                          </td>
                          <td style={{ color: r.goals > 0 ? "#f59e0b" : "var(--fm-muted)" }}>{r.goals}</td>
                          <td style={{ color: r.assists > 0 ? "#10b981" : "var(--fm-muted)" }}>{r.assists}</td>
                          <td style={{ color: r.yellowCards > 0 ? "#f59e0b" : "var(--fm-muted)" }}>{r.yellowCards}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Commentary */}
        <div className="w-80 border-l flex flex-col overflow-hidden shrink-0" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
          <div className="p-2 border-b text-xs font-semibold" style={{ borderColor: "var(--fm-border)", color: "var(--fm-muted)" }}>
            MATCH COMMENTARY
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {commentary.length === 0 && (
              <div className="text-xs text-center py-8" style={{ color: "var(--fm-muted)" }}>
                {isCompleted ? "No commentary available" : "Commentary will appear here during the match"}
              </div>
            )}
            {[...commentary].reverse().map((line, i) => (
              <div key={i} className="flex gap-2 p-1.5 rounded text-xs" style={{
                background: ["goal", "kickoff", "halftime", "fulltime"].includes(line.type) ? "var(--fm-active-bg)" : "transparent",
                borderLeft: line.type === "goal" ? "2px solid #f59e0b" : line.type === "card" ? "2px solid #ef4444" : "2px solid transparent",
              }}>
                <span className="shrink-0 w-8 font-mono font-bold" style={{ color: commentaryColors[line.type] ?? "var(--fm-muted)" }}>
                  {line.minute}'
                </span>
                <span className="shrink-0">{commentaryIcons[line.type] ?? "•"}</span>
                <span style={{ color: line.type === "general" ? "var(--fm-muted)" : "var(--fm-text)" }}>
                  {line.text}
                </span>
              </div>
            ))}
          </div>

          {/* Goal events */}
          {isCompleted && events.filter(e => e.type === "goal").length > 0 && (
            <div className="border-t p-2" style={{ borderColor: "var(--fm-border)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--fm-muted)" }}>GOALS</div>
              {events.filter(e => e.type === "goal").sort((a, b) => a.minute - b.minute).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs mb-1">
                  <span className="font-mono font-bold" style={{ color: "#f59e0b" }}>{e.minute}'</span>
                  <span>⚽</span>
                  <span style={{ color: e.clubId === playerClubId ? "var(--fm-accent)" : "var(--fm-text)" }}>{e.playerName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
