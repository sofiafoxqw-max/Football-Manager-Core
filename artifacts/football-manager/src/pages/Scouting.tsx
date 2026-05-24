import { useState } from "react";
import { useGetShortlist, useRemoveFromShortlist, useScoutSearch, useAddToShortlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Star, Trash2, Plus, Eye } from "lucide-react";

const POSITIONS = ["", "GK", "CB", "RB", "LB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "ST", "CF"];

function OvrBadge({ ovr }: { ovr: number }) {
  const cls = ovr >= 85 ? "ovr-elite" : ovr >= 78 ? "ovr-great" : ovr >= 70 ? "ovr-good" : ovr >= 62 ? "ovr-avg" : "ovr-poor";
  return <span className={`fm-badge ${cls}`}>{ovr}</span>;
}

function AttrBar({ val }: { val: number }) {
  const color = val >= 80 ? "#10b981" : val >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <div className="attr-bar-bg" style={{ width: 40 }}>
      <div className="attr-bar-fill" style={{ width: `${val}%`, background: color }} />
    </div>
  );
}

export default function Scouting() {
  const { data: shortlist, refetch: refetchShortlist } = useGetShortlist();
  const removeFromShortlist = useRemoveFromShortlist();
  const scoutSearch = useScoutSearch();
  const addToShortlist = useAddToShortlist();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"shortlist" | "search">("shortlist");
  const [searchFilters, setSearchFilters] = useState({ position: "", minOverall: 65, maxAge: 32, maxValue: 100000 });
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    const res = await scoutSearch.mutateAsync({
      data: {
        position: searchFilters.position || undefined,
        minOverall: searchFilters.minOverall,
        maxAge: searchFilters.maxAge,
        maxValue: searchFilters.maxValue * 1000,
      }
    });
    setResults(res as any[]);
    setSearching(false);
  };

  const handleAddToShortlist = async (playerId: number) => {
    await addToShortlist.mutateAsync({ data: { playerId } });
    qc.invalidateQueries({ queryKey: ["getShortlist"] });
  };

  const handleRemove = async (playerId: number) => {
    await removeFromShortlist.mutateAsync({ playerId });
    refetchShortlist();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <Search className="w-3.5 h-3.5" />
        Scouting & Shortlist
        <div className="ml-auto flex gap-1">
          {(["shortlist", "search"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="fm-btn" style={{
              background: tab === t ? "var(--fm-accent)" : "var(--fm-panel)",
              color: tab === t ? "#fff" : "var(--fm-nav-text)",
              border: "1px solid var(--fm-border)", textTransform: "capitalize"
            }}>
              {t === "shortlist" ? `Shortlist (${shortlist?.length ?? 0})` : "Scout Search"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === "shortlist" && (
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
                  <th>Club</th>
                  <th>Value</th>
                  <th>Wage</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shortlist?.map(p => (
                  <tr key={p.playerId}>
                    <td><span style={{ color: "var(--fm-text)", fontWeight: 500 }}>{p.playerName}</span></td>
                    <td><span style={{ color: "var(--fm-muted)" }}>{p.age}</span></td>
                    <td><span style={{ color: "var(--fm-muted)" }}>{p.nationality?.slice(0, 3).toUpperCase()}</span></td>
                    <td><span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)" }}>{p.position}</span></td>
                    <td><OvrBadge ovr={p.overall} /></td>
                    <td><span style={{ color: "#60a5fa" }}>{p.potential}</span></td>
                    <td><span style={{ color: "var(--fm-muted)" }}>{p.clubName}</span></td>
                    <td><span style={{ color: "#34d399" }}>£{(p.value / 1000).toFixed(0)}k</span></td>
                    <td><span style={{ color: "var(--fm-muted)" }}>£{p.weeklySalary.toLocaleString()}pw</span></td>
                    <td>
                      {p.isOnTransferList
                        ? <span className="fm-badge" style={{ background: "#10b98122", color: "#10b981" }}>For Sale</span>
                        : <span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)" }}>Contract</span>}
                    </td>
                    <td><span style={{ color: "var(--fm-muted)" }}>{p.dateAdded}</span></td>
                    <td>
                      <button onClick={() => handleRemove(p.playerId)} className="fm-btn" style={{ background: "transparent", color: "var(--fm-muted)", padding: "2px 4px" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!shortlist?.length && (
                  <tr><td colSpan={12} style={{ textAlign: "center", color: "var(--fm-muted)", padding: "24px" }}>No players on shortlist. Use Scout Search to find players.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "search" && (
          <div className="space-y-4">
            <div className="fm-panel p-3">
              <div className="text-xs font-semibold mb-3" style={{ color: "var(--fm-text)" }}>SEARCH FILTERS</div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Position</label>
                  <select className="fm-select w-full" value={searchFilters.position}
                    onChange={e => setSearchFilters(f => ({ ...f, position: e.target.value }))}>
                    {POSITIONS.map(p => <option key={p} value={p}>{p || "Any position"}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Min Overall</label>
                  <input type="number" className="fm-input w-full" min={40} max={99} value={searchFilters.minOverall}
                    onChange={e => setSearchFilters(f => ({ ...f, minOverall: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Max Age</label>
                  <input type="number" className="fm-input w-full" min={16} max={45} value={searchFilters.maxAge}
                    onChange={e => setSearchFilters(f => ({ ...f, maxAge: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--fm-muted)" }}>Max Value (£k)</label>
                  <input type="number" className="fm-input w-full" min={0} value={searchFilters.maxValue}
                    onChange={e => setSearchFilters(f => ({ ...f, maxValue: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="mt-3">
                <button className="fm-btn fm-btn-primary" onClick={handleSearch} disabled={searching}>
                  <Search className="w-3.5 h-3.5" />
                  {searching ? "Searching..." : "Run Scout Search"}
                </button>
              </div>
            </div>

            {results.length > 0 && (
              <div className="fm-panel">
                <div className="p-2 border-b text-xs font-semibold" style={{ borderColor: "var(--fm-border)", color: "var(--fm-muted)" }}>
                  {results.length} PLAYERS FOUND
                </div>
                <table className="fm-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Age</th>
                      <th>Pos</th>
                      <th>OVR</th>
                      <th>POT</th>
                      <th>Club</th>
                      <th>PAC</th>
                      <th>SHO</th>
                      <th>PAS</th>
                      <th>DRI</th>
                      <th>DEF</th>
                      <th>PHY</th>
                      <th>Value</th>
                      <th>Scout</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((p: any) => (
                      <tr key={p.playerId}>
                        <td><span style={{ color: "var(--fm-text)", fontWeight: 500 }}>{p.playerName}</span></td>
                        <td><span style={{ color: "var(--fm-muted)" }}>{p.age}</span></td>
                        <td><span className="fm-badge" style={{ background: "var(--fm-panel)", color: "var(--fm-muted)" }}>{p.position}</span></td>
                        <td><OvrBadge ovr={p.overall} /></td>
                        <td><span style={{ color: "#60a5fa" }}>{p.potential}</span></td>
                        <td><span style={{ color: "var(--fm-muted)" }}>{p.clubName}</span></td>
                        <td><AttrBar val={p.attributes?.pace ?? 0} /></td>
                        <td><AttrBar val={p.attributes?.shooting ?? 0} /></td>
                        <td><AttrBar val={p.attributes?.passing ?? 0} /></td>
                        <td><AttrBar val={p.attributes?.dribbling ?? 0} /></td>
                        <td><AttrBar val={p.attributes?.defending ?? 0} /></td>
                        <td><AttrBar val={p.attributes?.physicality ?? 0} /></td>
                        <td><span style={{ color: "#34d399" }}>£{(p.value / 1000).toFixed(0)}k</span></td>
                        <td>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5" style={{ color: i < p.scoutRating ? "#f59e0b" : "var(--fm-border)" }} fill={i < p.scoutRating ? "#f59e0b" : "none"} />
                            ))}
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handleAddToShortlist(p.playerId)} className="fm-btn fm-btn-primary" style={{ padding: "2px 8px", fontSize: "11px" }}>
                            <Plus className="w-3 h-3" /> Watch
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
