import { useState } from "react";
import { useFmGetTransferMarket, useListTransfers, useMakeTransferOffer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, TrendingUp } from "lucide-react";

function OvrBadge({ ovr }: { ovr: number }) {
  const cls = ovr >= 85 ? "ovr-elite" : ovr >= 78 ? "ovr-great" : ovr >= 70 ? "ovr-good" : ovr >= 62 ? "ovr-avg" : "ovr-poor";
  return <span className={`fm-badge ${cls}`}>{ovr}</span>;
}

const POSITIONS = ["", "GK", "CB", "RB", "LB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "ST", "CF"];

export default function Transfers() {
  const { data: market, isLoading: marketLoading } = useFmGetTransferMarket();
  const { data: history } = useListTransfers();
  const makeOffer = useMakeTransferOffer();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"market" | "offers" | "history">("market");
  const [posFilter, setPosFilter] = useState("");
  const [offerPlayer, setOfferPlayer] = useState<any>(null);
  const [offerAmount, setOfferAmount] = useState(0);
  const [offerResult, setOfferResult] = useState<any>(null);

  const filtered = (market ?? []).filter((p: any) => !posFilter || p.position === posFilter);

  const handleOffer = async () => {
    if (!offerPlayer) return;
    const res = await makeOffer.mutateAsync({
      data: { playerId: offerPlayer.id, offerAmount, offeredSalary: offerPlayer.weeklySalary }
    });
    setOfferResult(res);
    qc.invalidateQueries({ queryKey: ["fmGetTransferMarket"] });
    qc.invalidateQueries({ queryKey: ["listTransfers"] });
  };

  const offerStatusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "#f59e0b22", text: "#f59e0b", label: "Pending" },
    accepted: { bg: "#10b98122", text: "#10b981", label: "Accepted" },
    rejected: { bg: "#ef444422", text: "#ef4444", label: "Rejected" },
    completed: { bg: "#3b82f622", text: "#3b82f6", label: "Completed" },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <ArrowRightLeft className="w-3.5 h-3.5" />
        Transfer Market
        <div className="ml-auto flex gap-1">
          {(["market", "offers", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="fm-btn" style={{
              background: tab === t ? "var(--fm-accent)" : "var(--fm-panel)",
              color: tab === t ? "#fff" : "var(--fm-nav-text)",
              border: "1px solid var(--fm-border)", textTransform: "capitalize"
            }}>
              {t === "offers" ? "Offers" : t === "history" ? "History" : "Market"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          {tab === "market" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select className="fm-select" value={posFilter} onChange={e => setPosFilter(e.target.value)}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p || "All positions"}</option>)}
                </select>
                <span className="text-xs" style={{ color: "var(--fm-muted)" }}>{filtered.length} players listed</span>
              </div>
              <div className="fm-panel">
                <table className="fm-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Age</th>
                      <th>Nat</th>
                      <th>Pos</th>
                      <th>OVR</th>
                      <th>POT</th>
                      <th>PAC</th>
                      <th>SHO</th>
                      <th>PAS</th>
                      <th>DEF</th>
                      <th>Club</th>
                      <th>Value</th>
                      <th>Wage</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketLoading && (
                      <tr><td colSpan={14} style={{ textAlign: "center", color: "var(--fm-muted)", padding: "24px" }}>Loading market...</td></tr>
                    )}
                    {filtered.map((p: any) => (
                      <tr key={p.id} style={{ background: offerPlayer?.id === p.id ? "var(--fm-active-bg)" : undefined }}>
                        <td><span style={{ color: "var(--fm-text)", fontWeight: 500 }}>{p.name}</span></td>
                        <td style={{ color: "var(--fm-muted)" }}>{p.age}</td>
                        <td style={{ color: "var(--fm-muted)" }}>{p.nationality?.slice(0, 3).toUpperCase()}</td>
                        <td><span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)" }}>{p.position}</span></td>
                        <td><OvrBadge ovr={p.overall} /></td>
                        <td style={{ color: "#60a5fa" }}>{p.potential}</td>
                        <td style={{ color: "var(--fm-muted)" }}>{p.attributes?.pace ?? "-"}</td>
                        <td style={{ color: "var(--fm-muted)" }}>{p.attributes?.shooting ?? "-"}</td>
                        <td style={{ color: "var(--fm-muted)" }}>{p.attributes?.passing ?? "-"}</td>
                        <td style={{ color: "var(--fm-muted)" }}>{p.attributes?.defending ?? "-"}</td>
                        <td style={{ color: "var(--fm-muted)" }}>{p.clubName}</td>
                        <td style={{ color: "#34d399" }}>£{(p.value / 1000).toFixed(0)}k</td>
                        <td style={{ color: "var(--fm-muted)" }}>£{p.weeklySalary.toLocaleString()}pw</td>
                        <td>
                          <button className="fm-btn fm-btn-primary" style={{ padding: "2px 10px", fontSize: "11px" }}
                            onClick={() => { setOfferPlayer(p); setOfferAmount(p.value); setOfferResult(null); }}>
                            Bid
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && !marketLoading && (
                      <tr><td colSpan={14} style={{ textAlign: "center", color: "var(--fm-muted)", padding: "24px" }}>No players listed for transfer.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "offers" && (
            <div className="fm-panel p-8 text-center" style={{ color: "var(--fm-muted)" }}>
              Transfer offer history will appear here after bids are submitted.
            </div>
          )}

          {tab === "history" && (
            <div className="fm-panel">
              <table className="fm-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Fee</th>
                    <th>Week</th>
                  </tr>
                </thead>
                <tbody>
                  {history?.map((t: any) => (
                    <tr key={t.id}>
                      <td style={{ color: "var(--fm-text)", fontWeight: 500 }}>{t.playerName}</td>
                      <td>
                        <span className="fm-badge" style={{
                          background: t.type === "purchase" ? "#3b82f622" : "#10b98122",
                          color: t.type === "purchase" ? "#60a5fa" : "#34d399"
                        }}>{t.type}</span>
                      </td>
                      <td style={{ color: "var(--fm-muted)" }}>{t.fromClubName ?? "—"}</td>
                      <td style={{ color: "var(--fm-muted)" }}>{t.toClubName ?? "—"}</td>
                      <td style={{ color: "#34d399" }}>£{(t.fee / 1000).toFixed(0)}k</td>
                      <td style={{ color: "var(--fm-muted)" }}>{t.week}</td>
                    </tr>
                  ))}
                  {!history?.length && (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--fm-muted)", padding: "24px" }}>No transfer history.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bid panel */}
        {offerPlayer && tab === "market" && (
          <div className="w-72 border-l shrink-0" style={{ borderColor: "var(--fm-border)", background: "var(--fm-panel)" }}>
            <div className="p-3 border-b" style={{ borderColor: "var(--fm-border)" }}>
              <div className="text-xs font-bold" style={{ color: "var(--fm-text)" }}>MAKE TRANSFER BID</div>
              <div className="text-lg font-semibold mt-1" style={{ color: "var(--fm-text)" }}>{offerPlayer.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--fm-muted)" }}>
                {offerPlayer.position} • {offerPlayer.age} yrs • OVR {offerPlayer.overall}
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--fm-muted)" }}>Market Value</div>
                <div className="font-semibold" style={{ color: "#34d399" }}>£{(offerPlayer.value / 1000).toFixed(0)}k</div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Your Bid (£k)</label>
                <input type="number" className="fm-input w-full"
                  value={Math.round(offerAmount / 1000)}
                  onChange={e => setOfferAmount(Number(e.target.value) * 1000)} />
                <div className="flex gap-1 mt-1">
                  {[0.8, 1.0, 1.2, 1.5].map(mult => (
                    <button key={mult} onClick={() => setOfferAmount(Math.round(offerPlayer.value * mult))}
                      className="fm-btn flex-1" style={{
                        background: "var(--fm-panel)", color: "var(--fm-muted)",
                        border: "1px solid var(--fm-border)", padding: "2px", fontSize: "10px"
                      }}>
                      {mult === 1.0 ? "Val" : `×${mult}`}
                    </button>
                  ))}
                </div>
              </div>
              <button className="fm-btn fm-btn-primary w-full justify-center" onClick={handleOffer} disabled={makeOffer.isPending}>
                <TrendingUp className="w-3.5 h-3.5" />
                {makeOffer.isPending ? "Sending..." : "Submit Bid"}
              </button>
              {offerResult && (
                <div className="p-2 rounded text-xs" style={{
                  background: offerResult.accepted ? "#10b98122" : "#ef444422",
                  border: `1px solid ${offerResult.accepted ? "#10b98133" : "#ef444433"}`,
                  color: offerResult.accepted ? "#34d399" : "#f87171"
                }}>
                  {offerResult.accepted ? "✓ Bid accepted!" : "✗ Bid rejected."} {offerResult.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
