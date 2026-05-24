import { useState } from "react";
import { useGetSquad } from "@workspace/api-client-react";
import { Users, Activity, TrendingUp, Heart } from "lucide-react";

const positionOrder = ["GK", "CB", "RB", "LB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "ST"];

function OvrBadge({ ovr }: { ovr: number }) {
  const cls = ovr >= 85 ? "ovr-elite" : ovr >= 78 ? "ovr-great" : ovr >= 70 ? "ovr-good" : ovr >= 62 ? "ovr-avg" : "ovr-poor";
  return <span className={`fm-badge ${cls}`}>{ovr}</span>;
}

function MoraleIcon({ morale }: { morale: string }) {
  const colors: Record<string, string> = { excellent: "#10b981", good: "#34d399", okay: "#f59e0b", poor: "#f97316", unhappy: "#ef4444" };
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: colors[morale] ?? "#6b7280" }} />;
}

function FitnessBar({ fitness }: { fitness: number }) {
  const color = fitness >= 80 ? "#10b981" : fitness >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="attr-bar-bg flex-1" style={{ minWidth: 50 }}>
        <div className="attr-bar-fill" style={{ width: `${fitness}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color: "var(--fm-muted)", minWidth: 28 }}>{fitness}%</span>
    </div>
  );
}

export default function Squad() {
  const { data: squad, isLoading } = useGetSquad();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("position");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isLoading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>Loading squad...</div>;

  const filterGroups = [
    { key: "all", label: "All" },
    { key: "gk", label: "GK" },
    { key: "def", label: "DEF" },
    { key: "mid", label: "MID" },
    { key: "att", label: "ATT" },
    { key: "injured", label: "Injured" },
  ];

  const posGroupMap: Record<string, string> = {
    GK: "gk", CB: "def", RB: "def", LB: "def", CDM: "mid", CM: "mid", CAM: "mid",
    RM: "mid", LM: "mid", RW: "att", LW: "att", CF: "att", ST: "att",
  };

  let filtered = squad ?? [];
  if (filter === "injured") filtered = filtered.filter(p => p.isInjured);
  else if (filter !== "all") filtered = filtered.filter(p => posGroupMap[p.position] === filter);

  if (sortBy === "position") filtered = [...filtered].sort((a, b) =>
    positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));
  else if (sortBy === "overall") filtered = [...filtered].sort((a, b) => b.overall - a.overall);
  else if (sortBy === "value") filtered = [...filtered].sort((a, b) => b.value - a.value);
  else if (sortBy === "age") filtered = [...filtered].sort((a, b) => a.age - b.age);

  const selected = squad?.find(p => p.id === selectedId);

  const totalWages = squad?.reduce((s, p) => s + p.weeklySalary, 0) ?? 0;
  const avgOvr = squad ? Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length) : 0;
  const injured = squad?.filter(p => p.isInjured).length ?? 0;

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <Users className="w-3.5 h-3.5" />
        First Team Squad
        <div className="ml-4 flex items-center gap-2 text-xs">
          <span style={{ color: "var(--fm-muted)" }}>{squad?.length ?? 0} players</span>
          <span style={{ color: "var(--fm-border)" }}>•</span>
          <span style={{ color: "var(--fm-muted)" }}>Avg OVR: <strong style={{ color: "var(--fm-text)" }}>{avgOvr}</strong></span>
          <span style={{ color: "var(--fm-border)" }}>•</span>
          <span style={{ color: "var(--fm-muted)" }}>Wages: <strong style={{ color: "#34d399" }}>£{totalWages.toLocaleString()}k pw</strong></span>
          {injured > 0 && <>
            <span style={{ color: "var(--fm-border)" }}>•</span>
            <span style={{ color: "#f87171" }}>{injured} injured</span>
          </>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex gap-1">
            {filterGroups.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} className="fm-btn" style={{
                background: filter === f.key ? "var(--fm-accent)" : "var(--fm-panel)",
                color: filter === f.key ? "#fff" : "var(--fm-nav-text)",
                border: "1px solid var(--fm-border)", padding: "2px 8px", fontSize: "11px"
              }}>{f.label}</button>
            ))}
          </div>
          <select className="fm-select text-xs" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="position">Sort: Position</option>
            <option value="overall">Sort: Overall</option>
            <option value="value">Sort: Value</option>
            <option value="age">Sort: Age</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="fm-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>Pos</th>
                <th>Player</th>
                <th>Age</th>
                <th>Nat</th>
                <th>OVR</th>
                <th>POT</th>
                <th>PAC</th>
                <th>SHO</th>
                <th>PAS</th>
                <th>DRI</th>
                <th>DEF</th>
                <th>PHY</th>
                <th>Fitness</th>
                <th>Morale</th>
                <th>Form</th>
                <th>Value</th>
                <th>Wage</th>
                <th>Contract</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(player => (
                <tr key={player.id}
                  style={{ background: selectedId === player.id ? "var(--fm-active-bg)" : undefined, cursor: "pointer", opacity: player.isInjured ? 0.7 : 1 }}
                  onClick={() => setSelectedId(player.id === selectedId ? null : player.id)}>
                  <td>
                    <span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)", fontSize: "10px" }}>
                      {player.position}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {player.isInjured && <span title="Injured" style={{ color: "#f87171", fontSize: "10px" }}>🤕</span>}
                      <span style={{ color: "var(--fm-text)", fontWeight: 500 }}>{player.name}</span>
                      {player.role && <span className="text-xs" style={{ color: "var(--fm-muted)" }}>({player.role})</span>}
                    </div>
                  </td>
                  <td style={{ color: "var(--fm-muted)" }}>{player.age}</td>
                  <td style={{ color: "var(--fm-muted)" }}>{player.nationality?.slice(0, 3).toUpperCase()}</td>
                  <td><OvrBadge ovr={player.overall} /></td>
                  <td><span style={{ color: player.potential > player.overall ? "#60a5fa" : "var(--fm-muted)" }}>{player.potential}</span></td>
                  {["pace","shooting","passing","dribbling","defending","physicality"].map(attr => {
                    const v = (player.attributes as any)?.[attr] ?? 0;
                    return (
                      <td key={attr}>
                        <span style={{ color: v >= 80 ? "#10b981" : v >= 65 ? "var(--fm-text)" : "var(--fm-muted)", fontWeight: v >= 80 ? "600" : "400", fontSize: "12px" }}>
                          {v}
                        </span>
                      </td>
                    );
                  })}
                  <td style={{ minWidth: 80 }}><FitnessBar fitness={player.fitness} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <MoraleIcon morale={player.morale} />
                      <span className="text-xs capitalize" style={{ color: "var(--fm-muted)" }}>{player.morale}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: player.form >= 7 ? "#10b981" : player.form >= 6 ? "var(--fm-text)" : "#f87171" }}>
                      {player.form.toFixed(1)}
                    </span>
                  </td>
                  <td style={{ color: "#34d399", fontSize: "12px" }}>£{player.value.toLocaleString()}k</td>
                  <td style={{ color: "var(--fm-muted)", fontSize: "12px" }}>£{player.weeklySalary.toLocaleString()}k</td>
                  <td style={{ color: "var(--fm-muted)", fontSize: "12px" }}>2028</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={18} style={{ textAlign: "center", color: "var(--fm-muted)", padding: "24px" }}>No players found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Player detail panel */}
        {selected && (
          <div className="w-64 border-l shrink-0 overflow-auto" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
            <div className="p-3 border-b" style={{ borderColor: "var(--fm-border)" }}>
              <div className="font-bold" style={{ color: "var(--fm-text)" }}>{selected.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--fm-muted)" }}>{selected.position} • {selected.age} yrs • {selected.nationality}</div>
              <div className="flex items-center gap-2 mt-2">
                <OvrBadge ovr={selected.overall} />
                <span className="text-xs" style={{ color: "var(--fm-muted)" }}>POT: <strong style={{ color: "#60a5fa" }}>{selected.potential}</strong></span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--fm-muted)" }}>ATTRIBUTES</div>
              {[
                { label: "Pace", key: "pace" }, { label: "Shooting", key: "shooting" },
                { label: "Passing", key: "passing" }, { label: "Dribbling", key: "dribbling" },
                { label: "Defending", key: "defending" }, { label: "Physicality", key: "physicality" },
              ].map(({ label, key }) => {
                const v = (selected.attributes as any)?.[key] ?? 0;
                const color = v >= 80 ? "#10b981" : v >= 65 ? "#3b82f6" : "#f59e0b";
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: "var(--fm-muted)" }}>{label}</span>
                      <span style={{ color, fontWeight: "600" }}>{v}</span>
                    </div>
                    <div className="attr-bar-bg">
                      <div className="attr-bar-fill" style={{ width: `${v}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t" style={{ borderColor: "var(--fm-border)" }}>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span style={{ color: "var(--fm-muted)" }}>Fitness</span><br /><strong style={{ color: "var(--fm-text)" }}>{selected.fitness}%</strong></div>
                  <div><span style={{ color: "var(--fm-muted)" }}>Form</span><br /><strong style={{ color: "var(--fm-text)" }}>{selected.form.toFixed(1)}</strong></div>
                  <div><span style={{ color: "var(--fm-muted)" }}>Value</span><br /><strong style={{ color: "#34d399" }}>£{selected.value.toLocaleString()}k</strong></div>
                  <div><span style={{ color: "var(--fm-muted)" }}>Wage</span><br /><strong style={{ color: "var(--fm-text)" }}>£{selected.weeklySalary.toLocaleString()}k</strong></div>
                </div>
              </div>
              {selected.isInjured && (
                <div className="p-2 rounded text-xs" style={{ background: "#ef444422", border: "1px solid #ef444433" }}>
                  <span style={{ color: "#f87171" }}>🤕 Injured • {selected.injuryWeeksLeft} week{selected.injuryWeeksLeft !== 1 ? "s" : ""} remaining</span>
                </div>
              )}
              {selected.playerDescription && (
                <div className="text-xs" style={{ color: "var(--fm-muted)" }}>{selected.playerDescription}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
