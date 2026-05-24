import { useState } from "react";
import { useListContracts, useOfferContractRenewal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

function OvrBadge({ ovr }: { ovr: number }) {
  const cls = ovr >= 85 ? "ovr-elite" : ovr >= 78 ? "ovr-great" : ovr >= 70 ? "ovr-good" : "ovr-avg";
  return <span className={`fm-badge ${cls}`}>{ovr}</span>;
}

export default function Contracts() {
  const { data: contracts } = useListContracts();
  const offerRenewal = useOfferContractRenewal();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<number | null>(null);
  const [offer, setOffer] = useState({ weeklySalary: 0, yearsLength: 2 });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const selectedPlayer = contracts?.find(c => c.playerId === selected);

  const handleOffer = async () => {
    if (!selected) return;
    const res = await offerRenewal.mutateAsync({
      playerId: selected,
      data: offer,
    });
    setResult(res as any);
    qc.invalidateQueries({ queryKey: ["listContracts"] });
    setTimeout(() => setResult(null), 5000);
  };

  const urgency = (endsYear: number) => {
    if (endsYear <= 2026) return { color: "#ef4444", label: "EXPIRES NOW" };
    if (endsYear <= 2027) return { color: "#f59e0b", label: "EXPIRES SOON" };
    return { color: "var(--fm-muted)", label: "OK" };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <FileText className="w-3.5 h-3.5" />
        Contract Management
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Player list */}
        <div className="flex-1 overflow-auto p-4">
          <div className="fm-panel">
            <div className="p-2 border-b text-xs" style={{ borderColor: "var(--fm-border)", color: "var(--fm-muted)" }}>
              EXPIRING CONTRACTS — players within 2 years of contract end
            </div>
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Age</th>
                  <th>OVR</th>
                  <th>Current Wage</th>
                  <th>Contract Ends</th>
                  <th>Morale</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contracts?.map(c => {
                  const u = urgency(c.contractEndsYear);
                  return (
                    <tr key={c.playerId} style={{ background: selected === c.playerId ? "var(--fm-active-bg)" : undefined }}
                      onClick={() => { setSelected(c.playerId); setOffer({ weeklySalary: Math.round(c.currentSalary * 1.1), yearsLength: 2 }); setResult(null); }}>
                      <td><span style={{ color: "var(--fm-text)", fontWeight: 500, cursor: "pointer" }}>{c.playerName}</span></td>
                      <td><span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)" }}>{c.position}</span></td>
                      <td><span style={{ color: "var(--fm-muted)" }}>{c.age}</span></td>
                      <td><OvrBadge ovr={c.overall} /></td>
                      <td><span style={{ color: "var(--fm-text)" }}>£{c.currentSalary.toLocaleString()}pw</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {c.contractEndsYear <= 2027 && <AlertTriangle className="w-3 h-3" style={{ color: u.color }} />}
                          <span style={{ color: u.color, fontWeight: 600 }}>{c.contractEndsYear}</span>
                        </div>
                      </td>
                      <td><span style={{ color: "var(--fm-muted)", textTransform: "capitalize" }}>{c.morale}</span></td>
                      <td>
                        {c.wantsToLeave
                          ? <span className="fm-badge" style={{ background: "#ef444422", color: "#ef4444" }}>Wants to leave</span>
                          : <span className="fm-badge" style={{ background: "#10b98122", color: "#10b981" }}>Happy</span>}
                      </td>
                      <td>
                        <button className="fm-btn fm-btn-primary" style={{ padding: "2px 8px", fontSize: "11px" }}
                          onClick={() => { setSelected(c.playerId); setOffer({ weeklySalary: Math.round(c.currentSalary * 1.1), yearsLength: 2 }); }}>
                          Offer
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!contracts?.length && (
                  <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--fm-muted)", padding: "24px" }}>
                    All contracts are secure. No players expiring within 2 years.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Offer panel */}
        {selected && selectedPlayer && (
          <div className="w-72 border-l shrink-0 flex flex-col" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
            <div className="p-3 border-b" style={{ borderColor: "var(--fm-border)" }}>
              <div className="text-xs font-bold" style={{ color: "var(--fm-text)" }}>CONTRACT OFFER</div>
              <div className="text-lg font-semibold mt-1" style={{ color: "var(--fm-text)" }}>{selectedPlayer.playerName}</div>
              <div className="text-xs" style={{ color: "var(--fm-muted)" }}>{selectedPlayer.position} • {selectedPlayer.age} yrs • OVR {selectedPlayer.overall}</div>
            </div>
            <div className="p-4 space-y-4 flex-1">
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--fm-muted)" }}>Current Weekly Wage</div>
                <div className="font-semibold" style={{ color: "var(--fm-text)" }}>£{selectedPlayer.currentSalary.toLocaleString()}pw</div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Offer Wage (£pw)</label>
                <input type="number" className="fm-input w-full" value={offer.weeklySalary}
                  onChange={e => setOffer(o => ({ ...o, weeklySalary: Number(e.target.value) }))} />
                {offer.weeklySalary > 0 && (
                  <div className="text-xs mt-0.5" style={{ color: offer.weeklySalary >= selectedPlayer.currentSalary ? "#34d399" : "#f87171" }}>
                    {offer.weeklySalary >= selectedPlayer.currentSalary ? "▲" : "▼"}
                    {Math.abs(Math.round((offer.weeklySalary / selectedPlayer.currentSalary - 1) * 100))}% vs current
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Contract Length (years)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(y => (
                    <button key={y} onClick={() => setOffer(o => ({ ...o, yearsLength: y }))} className="fm-btn flex-1"
                      style={{
                        background: offer.yearsLength === y ? "var(--fm-accent)" : "var(--fm-panel)",
                        color: offer.yearsLength === y ? "#fff" : "var(--fm-muted)",
                        border: "1px solid var(--fm-border)", padding: "4px"
                      }}>
                      {y}yr
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: "var(--fm-border)" }}>
                <div className="text-xs mb-2" style={{ color: "var(--fm-muted)" }}>
                  Annual cost: <span style={{ color: "var(--fm-text)" }}>£{(offer.weeklySalary * 52).toLocaleString()}</span>
                </div>
                <button className="fm-btn fm-btn-primary w-full justify-center" onClick={handleOffer} disabled={offerRenewal.isPending}>
                  {offerRenewal.isPending ? "Sending..." : "Make Offer"}
                </button>
              </div>

              {result && (
                <div className="p-2 rounded" style={{ background: result.success ? "#10b98122" : "#ef444422", border: `1px solid ${result.success ? "#10b981" : "#ef4444"}33` }}>
                  <div className="flex items-center gap-2">
                    {result.success ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className="text-xs" style={{ color: result.success ? "#34d399" : "#f87171" }}>{result.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
