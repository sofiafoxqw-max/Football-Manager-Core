import { useGetLeagueStandings } from "@workspace/api-client-react";
import { Trophy } from "lucide-react";

function FormPill({ result }: { result: string }) {
  const cls = result === "W" ? "form-W" : result === "D" ? "form-D" : "form-L";
  return <span className={`fm-badge ${cls}`} style={{ padding: "1px 4px", fontSize: "10px", borderRadius: "2px" }}>{result}</span>;
}

export default function League() {
  const { data: league, isLoading } = useGetLeagueStandings();

  if (isLoading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>Loading...</div>;

  const standings = league?.standings ?? [];
  const playerClub = standings.find((s: any) => s.isPlayerClub);

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <Trophy className="w-3.5 h-3.5" />
        {(league as any)?.leagueName ?? "Premier League"}
        {playerClub && (
          <div className="ml-4 flex items-center gap-3 text-xs">
            <span style={{ color: "var(--fm-accent)" }}>{(playerClub as any).clubName}</span>
            <span style={{ color: "var(--fm-muted)" }}>•</span>
            <span style={{ color: "var(--fm-muted)" }}>
              {(playerClub as any).position}{["st","nd","rd"][(playerClub as any).position-1] ?? "th"}
            </span>
            <span style={{ color: "var(--fm-muted)" }}>•</span>
            <span style={{ color: "#34d399" }}>{(playerClub as any).points} pts</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="fm-panel">
          <table className="fm-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Club</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
                <th>Form</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s: any) => {
                const isChampions = s.position <= 4;
                const isEuropa = s.position === 5 || s.position === 6;
                const isRelegation = s.position >= 18;
                const posColor = isChampions ? "#3b82f6" : isEuropa ? "#10b981" : isRelegation ? "#ef4444" : "var(--fm-muted)";
                return (
                  <tr key={s.clubId}
                    style={{
                      background: s.isPlayerClub ? "var(--fm-active-bg)" : undefined,
                      borderLeft: s.isPlayerClub ? "2px solid var(--fm-accent)" : undefined,
                    }}>
                    <td>
                      <div className="flex items-center gap-1">
                        <div className="w-0.5 h-3 rounded-full" style={{ background: posColor }} />
                        <span style={{ color: posColor, fontWeight: "600" }}>{s.position}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: s.isPlayerClub ? "var(--fm-accent)" : "var(--fm-text)", fontWeight: s.isPlayerClub ? "600" : "400" }}>
                        {s.clubName}
                      </span>
                    </td>
                    <td style={{ color: "var(--fm-muted)" }}>{s.played}</td>
                    <td style={{ color: "#10b981" }}>{s.won}</td>
                    <td style={{ color: "#f59e0b" }}>{s.drawn}</td>
                    <td style={{ color: "#ef4444" }}>{s.lost}</td>
                    <td style={{ color: "var(--fm-text)" }}>{s.goalsFor}</td>
                    <td style={{ color: "var(--fm-muted)" }}>{s.goalsAgainst}</td>
                    <td style={{ color: s.goalDifference >= 0 ? "#34d399" : "#f87171", fontWeight: "600" }}>
                      {s.goalDifference >= 0 ? "+" : ""}{s.goalDifference}
                    </td>
                    <td>
                      <span style={{ color: s.isPlayerClub ? "var(--fm-accent)" : "var(--fm-text)", fontWeight: "700", fontSize: "14px" }}>
                        {s.points}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {(s.recentForm ?? []).map((r: string, i: number) => <FormPill key={i} result={r} />)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "var(--fm-muted)" }}>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} /> Champions League</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} /> Europa League</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} /> Relegation</div>
        </div>
      </div>
    </div>
  );
}
