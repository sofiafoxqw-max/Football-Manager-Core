import { useState, useEffect } from "react";
import { useGetTactics, useUpdateTactics, useGetSquad, getGetTacticsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Target, Save, Users } from "lucide-react";

const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "4-5-1", "3-5-2", "3-4-3", "5-3-2", "5-4-1", "4-1-4-1", "4-3-2-1"];
const MENTALITIES = ["defensive", "balanced", "attacking", "counter", "tiki-taka", "pressing", "long-ball", "park-the-bus"];
const PRESS_OPTIONS = ["low", "medium", "high", "very-high"];
const TEMPO_OPTIONS = ["slow", "medium", "fast", "very-fast"];
const LINE_OPTIONS = ["deep", "normal", "high", "very-high"];

const formationPositions: Record<string, Array<{ x: number; y: number; pos: string }>> = {
  "4-3-3": [
    { x: 50, y: 90, pos: "GK" },
    { x: 15, y: 70, pos: "LB" }, { x: 35, y: 72, pos: "CB" }, { x: 65, y: 72, pos: "CB" }, { x: 85, y: 70, pos: "RB" },
    { x: 25, y: 50, pos: "CM" }, { x: 50, y: 48, pos: "CM" }, { x: 75, y: 50, pos: "CM" },
    { x: 15, y: 28, pos: "LW" }, { x: 50, y: 25, pos: "ST" }, { x: 85, y: 28, pos: "RW" },
  ],
  "4-4-2": [
    { x: 50, y: 90, pos: "GK" },
    { x: 15, y: 70, pos: "LB" }, { x: 35, y: 72, pos: "CB" }, { x: 65, y: 72, pos: "CB" }, { x: 85, y: 70, pos: "RB" },
    { x: 15, y: 50, pos: "LM" }, { x: 35, y: 50, pos: "CM" }, { x: 65, y: 50, pos: "CM" }, { x: 85, y: 50, pos: "RM" },
    { x: 35, y: 25, pos: "ST" }, { x: 65, y: 25, pos: "ST" },
  ],
  "4-2-3-1": [
    { x: 50, y: 90, pos: "GK" },
    { x: 15, y: 70, pos: "LB" }, { x: 35, y: 72, pos: "CB" }, { x: 65, y: 72, pos: "CB" }, { x: 85, y: 70, pos: "RB" },
    { x: 35, y: 55, pos: "CDM" }, { x: 65, y: 55, pos: "CDM" },
    { x: 15, y: 38, pos: "LM" }, { x: 50, y: 36, pos: "CAM" }, { x: 85, y: 38, pos: "RM" },
    { x: 50, y: 18, pos: "ST" },
  ],
  "4-5-1": [
    { x: 50, y: 90, pos: "GK" },
    { x: 15, y: 70, pos: "LB" }, { x: 35, y: 72, pos: "CB" }, { x: 65, y: 72, pos: "CB" }, { x: 85, y: 70, pos: "RB" },
    { x: 12, y: 48, pos: "LM" }, { x: 30, y: 50, pos: "CM" }, { x: 50, y: 48, pos: "CDM" }, { x: 70, y: 50, pos: "CM" }, { x: 88, y: 48, pos: "RM" },
    { x: 50, y: 22, pos: "ST" },
  ],
  "3-5-2": [
    { x: 50, y: 90, pos: "GK" },
    { x: 25, y: 72, pos: "CB" }, { x: 50, y: 74, pos: "CB" }, { x: 75, y: 72, pos: "CB" },
    { x: 10, y: 50, pos: "LWB" }, { x: 30, y: 50, pos: "CM" }, { x: 50, y: 50, pos: "CDM" }, { x: 70, y: 50, pos: "CM" }, { x: 90, y: 50, pos: "RWB" },
    { x: 35, y: 25, pos: "ST" }, { x: 65, y: 25, pos: "ST" },
  ],
};

const mentalityColors: Record<string, string> = {
  defensive: "#3b82f6", balanced: "#10b981", attacking: "#f59e0b",
  counter: "#8b5cf6", "tiki-taka": "#06b6d4", pressing: "#ef4444",
  "long-ball": "#84cc16", "park-the-bus": "#6b7280",
};

export default function Tactics() {
  const { data: tactics, isLoading: tacticsLoading } = useGetTactics();
  const { data: squad } = useGetSquad();
  const updateTactics = useUpdateTactics();
  const qc = useQueryClient();

  const [formation, setFormation] = useState("4-3-3");
  const [mentality, setMentality] = useState("balanced");
  const [pressing, setPressing] = useState("medium");
  const [tempo, setTempo] = useState("medium");
  const [defensiveLine, setDefensiveLine] = useState("normal");
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tactics) {
      setFormation(tactics.formation ?? "4-3-3");
      setMentality(tactics.mentality ?? "balanced");
      setPressing((tactics as any).pressing ?? "medium");
      setTempo((tactics as any).tempo ?? "medium");
      setDefensiveLine((tactics as any).defensiveLine ?? "normal");
      setCaptainId((tactics as any).captainId ?? null);
    }
  }, [tactics]);

  const handleSave = async () => {
    setSaving(true);
    await updateTactics.mutateAsync({
      data: { formation: formation as any, mentality: mentality as any, pressing: pressing as any, tempo: tempo as any, width: 50, defensiveLine: defensiveLine as any, captainId: captainId ?? undefined, startingXI: [] }
    });
    qc.invalidateQueries({ queryKey: getGetTacticsQueryKey() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const positions = formationPositions[formation] ?? formationPositions["4-3-3"];

  const positionOrder = ["GK", "CB", "RB", "LB", "CDM", "CDM", "CM", "CM", "CAM", "LM", "RM", "LWB", "RWB", "RW", "LW", "CF", "ST"];
  const assignedPlayers = squad ? positions.map((pos, i) => {
    const matching = squad.filter(p => p.position === pos.pos || positionOrder.indexOf(p.position) <= positionOrder.indexOf(pos.pos) + 2);
    return matching[i % matching.length];
  }) : [];

  if (tacticsLoading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>Loading tactics...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <Target className="w-3.5 h-3.5" />
        Tactics Board
        <button onClick={handleSave} disabled={saving} className="ml-auto fm-btn fm-btn-primary">
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : saving ? "Saving..." : "Save Tactics"}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Pitch */}
        <div className="flex-1 flex flex-col items-center justify-center p-4" style={{ background: "var(--fm-bg)" }}>
          <div className="relative rounded overflow-hidden" style={{
            width: 380, height: 520,
            background: "linear-gradient(180deg, #15532e 0%, #166534 16.66%, #15532e 16.66%, #166534 33.32%, #15532e 33.32%, #166534 49.98%, #15532e 49.98%, #166534 66.64%, #15532e 66.64%, #166534 83.3%, #15532e 83.3%, #166534 100%)",
            border: "2px solid #1a5c30",
          }}>
            {/* Pitch markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 380 520" style={{ opacity: 0.25 }}>
              <rect x="30" y="20" width="320" height="480" fill="none" stroke="white" strokeWidth="1.5" />
              <line x1="30" y1="260" x2="350" y2="260" stroke="white" strokeWidth="1.5" />
              <circle cx="190" cy="260" r="40" fill="none" stroke="white" strokeWidth="1.5" />
              <rect x="110" y="20" width="160" height="55" fill="none" stroke="white" strokeWidth="1.5" />
              <rect x="110" y="445" width="160" height="55" fill="none" stroke="white" strokeWidth="1.5" />
              <rect x="150" y="20" width="80" height="25" fill="none" stroke="white" strokeWidth="1.5" />
              <rect x="150" y="475" width="80" height="25" fill="none" stroke="white" strokeWidth="1.5" />
              <circle cx="190" cy="20" r="3" fill="white" />
              <circle cx="190" cy="500" r="3" fill="white" />
            </svg>

            {/* Players */}
            {positions.map((pos, i) => {
              const player = squad?.filter(p => !p.isInjured)[i];
              const x = (pos.x / 100) * 380;
              const y = (pos.y / 100) * 520;
              return (
                <div key={i} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg" style={{
                      background: "var(--fm-accent)", color: "#fff", border: "2px solid rgba(255,255,255,0.4)"
                    }}>
                      {pos.pos.slice(0, 2)}
                    </div>
                    <div className="px-1.5 py-0.5 rounded text-xs whitespace-nowrap shadow" style={{
                      background: "rgba(0,0,0,0.85)", color: "#fff", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", fontSize: "9px"
                    }}>
                      {player?.name?.split(" ").slice(-1)[0] ?? pos.pos}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs font-bold tracking-widest" style={{ color: "var(--fm-muted)" }}>
            {formation} — {mentality.toUpperCase()}
          </div>
        </div>

        {/* Settings panel */}
        <div className="w-72 border-l overflow-y-auto shrink-0" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
          <div className="p-3 border-b" style={{ borderColor: "var(--fm-border)" }}>
            <div className="text-xs font-semibold" style={{ color: "var(--fm-muted)" }}>TACTICAL SETTINGS</div>
          </div>
          <div className="p-4 space-y-5">
            {/* Formation */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--fm-muted)" }}>FORMATION</label>
              <div className="grid grid-cols-2 gap-1">
                {FORMATIONS.map(f => (
                  <button key={f} onClick={() => setFormation(f)} className="fm-btn justify-center" style={{
                    background: formation === f ? "var(--fm-accent)" : "var(--fm-panel)",
                    color: formation === f ? "#fff" : "var(--fm-nav-text)",
                    border: "1px solid var(--fm-border)", fontSize: "11px"
                  }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Mentality */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--fm-muted)" }}>MENTALITY</label>
              <div className="grid grid-cols-2 gap-1">
                {MENTALITIES.map(m => (
                  <button key={m} onClick={() => setMentality(m)} className="fm-btn justify-center" style={{
                    background: mentality === m ? (mentalityColors[m] + "33") : "var(--fm-panel)",
                    color: mentality === m ? mentalityColors[m] : "var(--fm-nav-text)",
                    border: `1px solid ${mentality === m ? mentalityColors[m] + "66" : "var(--fm-border)"}`,
                    fontSize: "11px", textTransform: "capitalize",
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            {[
              { label: "PRESSING", value: pressing, set: setPressing, options: PRESS_OPTIONS },
              { label: "TEMPO", value: tempo, set: setTempo, options: TEMPO_OPTIONS },
              { label: "DEFENSIVE LINE", value: defensiveLine, set: setDefensiveLine, options: LINE_OPTIONS },
            ].map(({ label, value, set, options }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: "var(--fm-muted)" }}>{label}</label>
                  <span className="text-xs font-semibold capitalize" style={{ color: "var(--fm-text)" }}>{value.replace("-", " ")}</span>
                </div>
                <div className="flex gap-1">
                  {options.map(o => (
                    <button key={o} onClick={() => set(o)} className="flex-1 py-1.5 rounded text-xs transition-all"
                      style={{
                        background: value === o ? "var(--fm-accent)" : "var(--fm-panel)",
                        color: value === o ? "#fff" : "var(--fm-muted)",
                        border: "1px solid var(--fm-border)",
                        textTransform: "capitalize",
                        fontSize: "9px",
                      }}>
                      {o.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Captain */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--fm-muted)" }}>CAPTAIN</label>
              <select className="fm-select w-full" value={captainId ?? ""} onChange={e => setCaptainId(Number(e.target.value) || null)}>
                <option value="">Auto-select</option>
                {squad?.slice(0, 15).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
