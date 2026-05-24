import { useState } from "react";
import { useGetTrainingSchedule, useUpdateTrainingSchedule, useGetIndividualTraining, useUpdateIndividualTraining } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dumbbell, User } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const TYPES = ["rest", "fitness", "tactics", "attacking", "defending", "set_pieces", "match_prep", "youth"] as const;
const INTENSITIES = ["light", "normal", "hard"] as const;
const FOCUSES = ["balanced", "fitness", "tactical", "attacking", "defending", "set_pieces"] as const;
const INDIVIDUAL_FOCUSES = ["pace", "shooting", "passing", "dribbling", "defending", "physicality", "goalkeeping", null] as const;

const typeColors: Record<string, string> = {
  rest: "#4a6080",
  fitness: "#10b981",
  tactics: "#3b82f6",
  attacking: "#f59e0b",
  defending: "#8b5cf6",
  set_pieces: "#06b6d4",
  match_prep: "#ec4899",
  youth: "#84cc16",
};

const intensityColors: Record<string, string> = {
  light: "#34d399",
  normal: "#f59e0b",
  hard: "#ef4444",
};

export default function Training() {
  const { data: schedule } = useGetTrainingSchedule();
  const { data: individual } = useGetIndividualTraining();
  const updateSchedule = useUpdateTrainingSchedule();
  const updateIndividual = useUpdateIndividualTraining();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"schedule" | "individual">("schedule");
  const [editing, setEditing] = useState<Record<string, { type: string; intensity: string }>>({});
  const [teamFocus, setTeamFocus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [indFocus, setIndFocus] = useState<Record<number, string | null>>({});

  const sessions = schedule?.sessions as Array<{ day: string; type: string; intensity: string }> ?? [];

  const getSession = (day: string) => {
    if (editing[day]) return editing[day];
    return sessions.find(s => s.day === day) ?? { type: "rest", intensity: "light" };
  };

  const updateSession = (day: string, field: string, value: string) => {
    const current = getSession(day);
    setEditing(prev => ({ ...prev, [day]: { ...current, [field]: value } }));
  };

  const saveSchedule = async () => {
    const updatedSessions = DAYS.map(day => ({ day, ...getSession(day) }));
    setSaving(true);
    await updateSchedule.mutateAsync({
      data: { sessions: updatedSessions as any, teamFocus: (teamFocus || (schedule?.teamFocus ?? "balanced")) as any, coachingBonus: schedule?.coachingBonus ?? 0 },
    });
    setEditing({});
    qc.invalidateQueries({ queryKey: ["getTrainingSchedule"] });
    setSaving(false);
  };

  const saveIndividual = async () => {
    const assignments = Object.entries(indFocus).map(([playerId, focus]) => ({
      playerId: Number(playerId),
      focus: focus as string | null | undefined,
    }));
    if (!assignments.length) return;
    await updateIndividual.mutateAsync({ data: { assignments } });
    qc.invalidateQueries({ queryKey: ["getIndividualTraining"] });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <Dumbbell className="w-3.5 h-3.5" />
        Training Centre
        <div className="ml-auto flex gap-1">
          {(["schedule", "individual"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="fm-btn"
              style={{ background: tab === t ? "var(--fm-accent)" : "var(--fm-panel)", color: tab === t ? "#fff" : "var(--fm-nav-text)", border: "1px solid var(--fm-border)", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === "schedule" && (
          <div className="space-y-4">
            <div className="fm-panel">
              <div className="p-3 border-b" style={{ borderColor: "var(--fm-border)" }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold" style={{ color: "var(--fm-text)" }}>WEEKLY SCHEDULE</div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--fm-muted)" }}>Team Focus:</span>
                      <select className="fm-select text-xs" value={teamFocus || (schedule?.teamFocus ?? "balanced")}
                        onChange={e => setTeamFocus(e.target.value)}>
                        {FOCUSES.map(f => <option key={f} value={f} style={{ textTransform: "capitalize" }}>{f.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    {schedule?.coachingBonus !== undefined && (
                      <span className="text-xs" style={{ color: "var(--fm-muted)" }}>
                        Coach Bonus: <span style={{ color: "#34d399" }}>+{Math.round((schedule.coachingBonus - 1) * 100)}%</span>
                      </span>
                    )}
                    <button className="fm-btn fm-btn-primary text-xs" onClick={saveSchedule} disabled={saving}>
                      {saving ? "Saving..." : "Save Schedule"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-px p-2" style={{ background: "var(--fm-border)" }}>
                {DAYS.map(day => {
                  const session = getSession(day);
                  return (
                    <div key={day} className="fm-card p-2 flex flex-col gap-2">
                      <div className="text-xs font-bold text-center capitalize" style={{ color: "var(--fm-text)" }}>
                        {day.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="w-full h-1 rounded" style={{ background: typeColors[session.type] ?? "#4a6080" }} />
                      <select className="fm-select text-xs w-full" value={session.type}
                        onChange={e => updateSession(day, "type", e.target.value)}>
                        {TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </select>
                      <select className="fm-select text-xs w-full" value={session.intensity}
                        onChange={e => updateSession(day, "intensity", e.target.value)}>
                        {INTENSITIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                      <div className="text-center">
                        <span className="fm-badge" style={{ background: intensityColors[session.intensity] + "22", color: intensityColors[session.intensity], fontSize: "9px" }}>
                          {session.intensity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TYPES.filter(t => t !== "rest").map(type => (
                <div key={type} className="fm-card p-3 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: typeColors[type] }} />
                  <div>
                    <div className="text-xs font-semibold capitalize" style={{ color: "var(--fm-text)" }}>{type.replace("_", " ")}</div>
                    <div className="text-xs" style={{ color: "var(--fm-muted)" }}>
                      {type === "fitness" && "Improves player fitness and stamina levels"}
                      {type === "tactics" && "Reinforces tactical shape and understanding"}
                      {type === "attacking" && "Improves attacking movement and finishing"}
                      {type === "defending" && "Improves defensive organisation and tackling"}
                      {type === "set_pieces" && "Practises corners, free kicks and throw-ins"}
                      {type === "match_prep" && "Light preparation for upcoming fixture"}
                      {type === "youth" && "Focus on youth player development"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "individual" && (
          <div className="fm-panel">
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "var(--fm-border)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--fm-text)" }}>INDIVIDUAL TRAINING FOCUS</div>
              <button className="fm-btn fm-btn-primary text-xs" onClick={saveIndividual}>Save Assignments</button>
            </div>
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Position</th>
                  <th>OVR</th>
                  <th>Focus</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {individual?.map(p => (
                  <tr key={p.playerId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" style={{ color: "var(--fm-muted)" }} />
                        <span style={{ color: "var(--fm-text)" }}>{p.playerName}</span>
                      </div>
                    </td>
                    <td><span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)" }}>{p.position}</span></td>
                    <td>
                      <span className="fm-badge" style={{ background: p.overall >= 80 ? "#3b82f622" : "#94a3b822", color: p.overall >= 80 ? "#60a5fa" : "#94a3b8" }}>
                        {p.overall}
                      </span>
                    </td>
                    <td>
                      <select className="fm-select text-xs"
                        value={indFocus[p.playerId] !== undefined ? (indFocus[p.playerId] ?? "") : (p.focus ?? "")}
                        onChange={e => setIndFocus(prev => ({ ...prev, [p.playerId]: e.target.value || null }))}>
                        <option value="">No focus</option>
                        {INDIVIDUAL_FOCUSES.filter(Boolean).map(f => (
                          <option key={f!} value={f!} style={{ textTransform: "capitalize" }}>{f}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="attr-bar-bg flex-1" style={{ minWidth: 60 }}>
                          <div className="attr-bar-fill" style={{ width: `${p.progress}%`, background: "var(--fm-accent)" }} />
                        </div>
                        <span className="text-xs" style={{ color: "var(--fm-muted)" }}>{p.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
