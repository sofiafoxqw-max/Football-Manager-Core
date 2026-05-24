import { useState } from "react";
import { useGetSetPieces, useUpdateSetPieces, useGetSquad } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Crosshair, Save } from "lucide-react";

const TYPES = [
  { key: "corner_attack", label: "Corner (Attack)", icon: "⚽" },
  { key: "corner_defend", label: "Corner (Defend)", icon: "🛡" },
  { key: "freekick_attack", label: "Free Kick (Attack)", icon: "🎯" },
  { key: "freekick_defend", label: "Free Kick (Defend)", icon: "🧱" },
  { key: "throwIn", label: "Throw-In", icon: "↗" },
];

const ROUTINES: Record<string, string[]> = {
  corner_attack: ["Inswinger to near post", "Outswinger to far post", "Short corner", "Driven low cross", "Flick-on at near post"],
  corner_defend: ["Zonal marking", "Man-to-man marking", "Mixed zone/man", "Sweeper keeper"],
  freekick_attack: ["Direct shot", "Low driven cross", "Chip to far post", "Short routine", "Pull-back to edge"],
  freekick_defend: ["Wall + goalkeeper", "All behind ball", "One man over wall", "Offside trap"],
  throwIn: ["Quick throw to nearest player", "Long throw into box", "Short and retain possession", "Switch to opposite flank"],
};

const AREAS = ["near_post", "far_post", "penalty_spot", "edge_of_box", "short"];

export default function SetPieces() {
  const { data: setpieces } = useGetSetPieces();
  const { data: squad } = useGetSquad();
  const updateSetPieces = useUpdateSetPieces();
  const qc = useQueryClient();
  const [routines, setRoutines] = useState<any[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = routines ?? (setpieces?.routines as any[] ?? []);

  const getRoutine = (type: string) => current.find((r: any) => r.type === type) ?? {
    type, routine: ROUTINES[type]?.[0] ?? "", takerId: null, takerName: null, targetArea: "penalty_spot",
  };

  const updateRoutine = (type: string, field: string, value: any) => {
    setRoutines(prev => {
      const arr = prev ?? (setpieces?.routines as any[] ?? []);
      const idx = arr.findIndex((r: any) => r.type === type);
      const updated = { ...getRoutine(type), [field]: value };
      if (field === "takerId") {
        const p = squad?.find(p => p.id === Number(value));
        updated.takerName = p?.name ?? null;
        updated.takerId = value ? Number(value) : null;
      }
      if (idx >= 0) {
        const copy = [...arr];
        copy[idx] = updated;
        return copy;
      }
      return [...arr, updated];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSetPieces.mutateAsync({ data: { routines: current } });
    qc.invalidateQueries({ queryKey: ["getSetPieces"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const attackers = squad?.filter(p => ["ST", "CF", "RW", "LW", "CAM", "CM"].includes(p.position)) ?? [];

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <Crosshair className="w-3.5 h-3.5" />
        Set Piece Instructions
        <button className="ml-auto fm-btn fm-btn-primary" onClick={handleSave} disabled={saving}>
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : saving ? "Saving..." : "Save Instructions"}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-4 max-w-3xl">
          {TYPES.map(({ key, label, icon }) => {
            const routine = getRoutine(key);
            const isAttack = key.includes("attack") || key === "throwIn";
            return (
              <div key={key} className="fm-panel">
                <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: "var(--fm-border)" }}>
                  <span className="text-xl">{icon}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--fm-text)" }}>{label}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="fm-badge" style={{ background: isAttack ? "#3b82f622" : "#8b5cf622", color: isAttack ? "#60a5fa" : "#a78bfa" }}>
                      {isAttack ? "ATTACKING" : "DEFENDING"}
                    </span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Routine</label>
                    <select className="fm-select w-full" value={routine.routine}
                      onChange={e => updateRoutine(key, "routine", e.target.value)}>
                      {(ROUTINES[key] ?? []).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Target Area</label>
                    <select className="fm-select w-full" value={routine.targetArea}
                      onChange={e => updateRoutine(key, "targetArea", e.target.value)}>
                      {AREAS.map(a => <option key={a} value={a}>{a.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  {isAttack && key !== "throwIn" && (
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Taker</label>
                      <select className="fm-select w-full" value={routine.takerId ?? ""}
                        onChange={e => updateRoutine(key, "takerId", e.target.value)}>
                        <option value="">Auto-select</option>
                        {attackers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-3">
                  <div className="p-2 rounded text-xs" style={{ background: "var(--fm-bg)", color: "var(--fm-muted)", border: "1px solid var(--fm-border)" }}>
                    <strong style={{ color: "var(--fm-text)" }}>{routine.routine}</strong>
                    {routine.targetArea && <span> → targeting <strong style={{ color: "#60a5fa" }}>{routine.targetArea.replace("_", " ")}</strong></span>}
                    {routine.takerName && <span> | Taker: <strong style={{ color: "#34d399" }}>{routine.takerName}</strong></span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
