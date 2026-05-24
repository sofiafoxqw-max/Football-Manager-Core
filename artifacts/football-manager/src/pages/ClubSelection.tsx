import { useFmListClubs, useSetupGame, getGetGameStateQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Trophy, MapPin, ChevronRight } from "lucide-react";

export default function ClubSelection() {
  const { data: clubs, isLoading } = useFmListClubs();
  const setupGame = useSetupGame();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [managerName, setManagerName] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!selectedClub || !managerName.trim()) {
      setError("Please select a club and enter your manager name.");
      return;
    }
    setStarting(true);
    setError("");
    await setupGame.mutateAsync({ data: { clubId: selectedClub.id, managerName: managerName.trim() } });
    queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
    setLocation("/dashboard");
  };

  const tierBadge = (prestige: number) => {
    if (prestige >= 5) return { label: "Elite", color: "#f59e0b" };
    if (prestige >= 4) return { label: "Top Flight", color: "#60a5fa" };
    if (prestige >= 3) return { label: "Established", color: "#34d399" };
    return { label: "Rising", color: "#94a3b8" };
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--fm-bg)" }}>
      <div className="text-sm" style={{ color: "var(--fm-muted)" }}>Loading clubs...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--fm-bg)" }}>
      {/* Left branding panel */}
      <div className="w-80 flex flex-col p-8 border-r shrink-0" style={{ background: "var(--fm-sidebar)", borderColor: "var(--fm-border)" }}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg" style={{ background: "var(--fm-accent)" }}>FM</div>
          <div>
            <div className="font-bold text-base" style={{ color: "var(--fm-text)" }}>Football Manager</div>
            <div className="text-xs" style={{ color: "var(--fm-muted)" }}>Season 2025/26</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-2xl font-bold mb-2" style={{ color: "var(--fm-text)" }}>
              Start Your<br />Managerial Career
            </div>
            <div className="text-sm" style={{ color: "var(--fm-muted)" }}>
              Choose your club, shape your tactics, and lead them to glory.
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: "🏆", title: "Full Season", desc: "38-game Premier League campaign" },
              { icon: "📋", title: "Complete Control", desc: "Tactics, transfers, training & more" },
              { icon: "⚽", title: "Live Match", desc: "Detailed commentary & player ratings" },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--fm-text)" }}>{f.title}</div>
                  <div className="text-xs" style={{ color: "var(--fm-muted)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedClub && (
          <div className="mt-auto">
            <div className="fm-panel p-4">
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--fm-muted)" }}>SELECTED CLUB</div>
              <div className="font-bold text-base mb-1" style={{ color: "var(--fm-text)" }}>{selectedClub.name}</div>
              <div className="text-xs mb-3" style={{ color: "var(--fm-muted)" }}>{selectedClub.description}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div><span style={{ color: "var(--fm-muted)" }}>Budget: </span><span style={{ color: "#34d399" }}>£{(selectedClub.transferBudget / 1000).toFixed(0)}k</span></div>
                <div><span style={{ color: "var(--fm-muted)" }}>Prestige: </span><span style={{ color: "var(--fm-text)" }}>{"★".repeat(selectedClub.prestige)}</span></div>
              </div>
              <div className="mb-3">
                <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Manager name</label>
                <input type="text" className="fm-input w-full" placeholder="Enter your name..."
                  value={managerName} onChange={e => setManagerName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleStart()} />
              </div>
              {error && <div className="text-xs mb-2" style={{ color: "#f87171" }}>{error}</div>}
              <button className="fm-btn fm-btn-primary w-full justify-center" onClick={handleStart} disabled={starting || !managerName.trim()}>
                {starting ? "Loading..." : "Begin Season"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Club grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <div className="text-lg font-bold" style={{ color: "var(--fm-text)" }}>Select Your Club</div>
          <div className="text-xs" style={{ color: "var(--fm-muted)" }}>Premier League 2025/26 — {clubs?.length ?? 0} clubs available</div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {clubs?.map(club => {
            const isSelected = selectedClub?.id === club.id;
            const tier = tierBadge((club as any).prestige ?? 3);
            return (
              <div key={club.id}
                onClick={() => setSelectedClub(club)}
                className="cursor-pointer rounded transition-all"
                style={{
                  background: isSelected ? "var(--fm-active-bg)" : "var(--fm-panel)",
                  border: `1px solid ${isSelected ? "var(--fm-accent)" : "var(--fm-border)"}`,
                  transform: isSelected ? "scale(1.01)" : "scale(1)",
                  outline: isSelected ? "2px solid var(--fm-accent)" : "none",
                  outlineOffset: "2px",
                }}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color: isSelected ? "var(--fm-accent)" : "var(--fm-text)" }}>
                        {club.name}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--fm-muted)" }}>{(club as any).stadium ?? ""}</div>
                    </div>
                    <span className="fm-badge ml-2 shrink-0" style={{ background: tier.color + "22", color: tier.color, fontSize: "9px" }}>
                      {tier.label}
                    </span>
                  </div>

                  <div className="text-xs mb-3" style={{ color: "var(--fm-muted)", lineHeight: 1.5 }}>
                    {(club as any).description?.substring(0, 80) ?? "Premier League club ready for a new manager."}...
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-1.5 rounded" style={{ background: "var(--fm-bg)" }}>
                      <div className="text-xs font-bold" style={{ color: "#34d399" }}>
                        £{((club.budget ?? 0) / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs" style={{ color: "var(--fm-muted)", fontSize: "9px" }}>Budget</div>
                    </div>
                    <div className="text-center p-1.5 rounded" style={{ background: "var(--fm-bg)" }}>
                      <div className="text-xs font-bold" style={{ color: "var(--fm-text)" }}>
                        {"★".repeat((club as any).prestige ?? 3)}
                      </div>
                      <div className="text-xs" style={{ color: "var(--fm-muted)", fontSize: "9px" }}>Prestige</div>
                    </div>
                    <div className="text-center p-1.5 rounded" style={{ background: "var(--fm-bg)" }}>
                      <div className="text-xs font-bold" style={{ color: "#60a5fa" }}>
                        {(club as any).squadSize ?? "25"}
                      </div>
                      <div className="text-xs" style={{ color: "var(--fm-muted)", fontSize: "9px" }}>Squad</div>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="px-4 pb-3">
                    <div className="text-xs text-center" style={{ color: "var(--fm-accent)" }}>
                      ✓ Selected — fill in your name on the left to begin
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
