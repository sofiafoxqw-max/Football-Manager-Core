import { useState } from "react";
import { useGetStaff, useGetStaffMarket, useHireStaff, useGetFinances } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { UserCog, Star, Plus, Check } from "lucide-react";

const roleLabels: Record<string, string> = {
  assistant_manager: "Assistant Manager",
  coach: "Coach",
  fitness_coach: "Fitness Coach",
  goalkeeper_coach: "Goalkeeper Coach",
  scout: "Scout",
  physio: "Physio",
  analyst: "Analyst",
};

const roleColors: Record<string, string> = {
  assistant_manager: "#3b82f6",
  coach: "#10b981",
  fitness_coach: "#f59e0b",
  goalkeeper_coach: "#8b5cf6",
  scout: "#06b6d4",
  physio: "#ec4899",
  analyst: "#84cc16",
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < rating ? "#f59e0b" : "var(--fm-border)" }} />
      ))}
    </div>
  );
}

export default function Staff() {
  const { data: staff } = useGetStaff();
  const { data: market } = useGetStaffMarket();
  const { data: finances } = useGetFinances();
  const hireStaff = useHireStaff();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"current" | "market">("current");
  const [hiring, setHiring] = useState<number | null>(null);
  const [hireError, setHireError] = useState<string | null>(null);

  const budget = finances?.balance ?? null;

  const canAfford = (weeklySalary: number) =>
    budget === null || budget >= weeklySalary * 52;

  const handleHire = async (staffId: number) => {
    setHiring(staffId);
    setHireError(null);
    try {
      await hireStaff.mutateAsync({ data: { staffId } });
      qc.invalidateQueries({ queryKey: ["getStaff"] });
      qc.invalidateQueries({ queryKey: ["getStaffMarket"] });
      qc.invalidateQueries({ queryKey: ["getFinances"] });
    } catch (err: any) {
      const msg = err?.errorData?.error ?? err?.message ?? "Failed to hire staff member.";
      setHireError(msg);
    } finally {
      setHiring(null);
    }
  };

  const renderTable = (members: any[], showHire: boolean) => (
    <table className="fm-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Nationality</th>
          <th>Speciality</th>
          <th>Rating</th>
          <th>Wage (pw)</th>
          {showHire && <th>Annual cost</th>}
          {showHire && <th></th>}
        </tr>
      </thead>
      <tbody>
        {members?.map((s: any) => {
          const affordable = canAfford(s.weeklySalary);
          return (
            <tr key={s.id} style={{ opacity: showHire && !affordable ? 0.5 : 1 }}>
              <td><span style={{ color: "var(--fm-text)", fontWeight: 500 }}>{s.name}</span></td>
              <td>
                <span className="fm-badge" style={{ background: (roleColors[s.role] ?? "#3b82f6") + "22", color: roleColors[s.role] ?? "#3b82f6" }}>
                  {roleLabels[s.role] ?? s.role}
                </span>
              </td>
              <td><span style={{ color: "var(--fm-muted)" }}>{s.nationality}</span></td>
              <td><span style={{ color: "var(--fm-muted)" }}>{s.speciality}</span></td>
              <td>
                <div className="flex items-center gap-2">
                  <RatingStars rating={s.rating} />
                  <span className="text-xs" style={{ color: "var(--fm-text)" }}>{s.rating}/10</span>
                </div>
              </td>
              <td><span style={{ color: "#34d399" }}>£{s.weeklySalary.toLocaleString()}/wk</span></td>
              {showHire && (
                <td>
                  <span style={{ color: affordable ? "var(--fm-muted)" : "#ef4444", fontSize: "11px" }}>
                    £{(s.weeklySalary * 52).toLocaleString()}/yr
                  </span>
                </td>
              )}
              {showHire && (
                <td>
                  <button
                    className="fm-btn fm-btn-primary"
                    style={{ padding: "2px 10px", fontSize: "11px", opacity: affordable ? 1 : 0.4, cursor: affordable ? "pointer" : "not-allowed" }}
                    onClick={() => affordable && handleHire(s.id)}
                    disabled={hiring === s.id || !affordable}
                    title={!affordable ? `Need £${(s.weeklySalary * 52).toLocaleString()} annual budget` : undefined}
                  >
                    <Plus className="w-3 h-3" />
                    {hiring === s.id ? "Hiring..." : affordable ? "Hire" : "Can't afford"}
                  </button>
                </td>
              )}
            </tr>
          );
        })}
        {!members?.length && (
          <tr><td colSpan={showHire ? 8 : 6} style={{ textAlign: "center", color: "var(--fm-muted)", padding: "24px" }}>
            {showHire ? "No staff available in the market." : "No staff hired yet. Check the market."}
          </td></tr>
        )}
      </tbody>
    </table>
  );

  const grouped = staff ? Object.entries(
    staff.reduce((acc: Record<string, any[]>, s: any) => {
      if (!acc[s.role]) acc[s.role] = [];
      acc[s.role].push(s);
      return acc;
    }, {} as Record<string, any[]>)
  ) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <UserCog className="w-3.5 h-3.5" />
        Staff Management
        <div className="ml-auto flex gap-1">
          {(["current", "market"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="fm-btn" style={{
              background: tab === t ? "var(--fm-accent)" : "var(--fm-panel)",
              color: tab === t ? "#fff" : "var(--fm-nav-text)",
              border: "1px solid var(--fm-border)"
            }}>
              {t === "current" ? `My Staff (${staff?.length ?? 0})` : `Market (${market?.length ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === "current" && (
          <div className="space-y-4">
            {grouped.length === 0 && (
              <div className="fm-panel p-8 text-center" style={{ color: "var(--fm-muted)" }}>
                No staff hired. Check the staff market to hire coaches and support staff.
              </div>
            )}
            {grouped.map(([role, members]) => (
              <div key={role} className="fm-panel">
                <div className="p-2 border-b" style={{ borderColor: "var(--fm-border)" }}>
                  <span className="fm-badge" style={{ background: (roleColors[role] ?? "#3b82f6") + "22", color: roleColors[role] ?? "#3b82f6" }}>
                    {roleLabels[role] ?? role}
                  </span>
                </div>
                {renderTable(members, false)}
              </div>
            ))}
          </div>
        )}

        {tab === "market" && (
          <div className="space-y-2">
            {hireError && (
              <div className="fm-panel p-3 text-sm" style={{ color: "#ef4444", border: "1px solid #ef444444", background: "#ef444411" }}>
                ⚠ {hireError}
              </div>
            )}
            <div className="fm-panel">
              <div className="p-2 border-b text-xs" style={{ borderColor: "var(--fm-border)", color: "var(--fm-muted)" }}>
                AVAILABLE STAFF — click Hire to add to your backroom team
              </div>
              {renderTable(market ?? [], true)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
