import { useGetFinances } from "@workspace/api-client-react";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function Finances() {
  const { data: finances, isLoading } = useGetFinances();

  if (isLoading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>Loading finances...</div>;
  if (!finances) return null;

  const wagePct = finances.wageBudget > 0 ? (finances.currentWeeklyWages / finances.wageBudget) * 100 : 0;
  const wageColor = wagePct >= 100 ? "#ef4444" : wagePct >= 85 ? "#f59e0b" : "#10b981";

  const sections = [
    {
      title: "BUDGETS",
      items: [
        { label: "Transfer Budget", value: `£${(finances.transferBudget ?? 0).toLocaleString()}k`, color: "#34d399", icon: TrendingUp },
        { label: "Wage Budget (pw)", value: `£${(finances.wageBudget ?? 0).toLocaleString()}k`, color: "var(--fm-text)", icon: null },
        { label: "Current Wages (pw)", value: `£${(finances.currentWeeklyWages ?? 0).toLocaleString()}k`, color: wageColor, icon: wagePct >= 85 ? AlertTriangle : null },
        { label: "Remaining Wage Room", value: `£${Math.max(0, finances.wageBudget - finances.currentWeeklyWages).toLocaleString()}k pw`, color: wagePct >= 100 ? "#ef4444" : "#34d399", icon: null },
      ]
    },
    {
      title: "SEASON INCOME",
      items: [
        { label: "Season Revenue", value: `£${(finances.seasonRevenue ?? 0).toLocaleString()}k`, color: "#34d399", icon: TrendingUp },
        { label: "Sponsorship", value: `£${(finances.sponsorshipRevenue ?? 0).toLocaleString()}k`, color: "var(--fm-text)", icon: null },
        { label: "Matchday Revenue", value: `£${(finances.matchdayRevenue ?? 0).toLocaleString()}k`, color: "var(--fm-text)", icon: null },
        { label: "Transfer Income", value: `£${(finances.transferIncome ?? 0).toLocaleString()}k`, color: "var(--fm-text)", icon: null },
      ]
    },
    {
      title: "SEASON EXPENDITURE",
      items: [
        { label: "Transfer Spending", value: `£${(finances.transferSpend ?? 0).toLocaleString()}k`, color: "#f87171", icon: TrendingDown },
        { label: "Season Expenditure", value: `£${(finances.seasonExpenditure ?? 0).toLocaleString()}k`, color: "#f87171", icon: null },
        { label: "Weekly Wages", value: `£${(finances.currentWeeklyWages ?? 0).toLocaleString()}k pw`, color: "var(--fm-muted)", icon: null },
        { label: "Net Spend", value: `£${((finances.transferSpend ?? 0) - (finances.transferIncome ?? 0)).toLocaleString()}k`, color: ((finances.transferSpend ?? 0) - (finances.transferIncome ?? 0)) >= 0 ? "#f87171" : "#34d399", icon: null },
      ]
    },
    {
      title: "PROJECTIONS",
      items: [
        { label: "Prize Money (Est.)", value: `£${(finances.prizeMoneyEstimate ?? 0).toLocaleString()}k`, color: "#60a5fa", icon: TrendingUp },
        { label: "End of Season Balance", value: `£${((finances.balance ?? 0) + (finances.seasonRevenue ?? 0) - (finances.seasonExpenditure ?? 0)).toLocaleString()}k`, color: ((finances.balance ?? 0) + (finances.seasonRevenue ?? 0) - (finances.seasonExpenditure ?? 0)) >= 0 ? "#34d399" : "#ef4444", icon: null },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="fm-section-header">
        <DollarSign className="w-3.5 h-3.5" />
        Club Finances
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Wage usage bar */}
        <div className="fm-panel p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold" style={{ color: "var(--fm-text)" }}>WAGE BUDGET USAGE</div>
            <div className="text-xs" style={{ color: wageColor }}>
              {wagePct.toFixed(0)}% used
              {wagePct >= 100 && " — OVER BUDGET"}
            </div>
          </div>
          <div className="h-3 rounded overflow-hidden" style={{ background: "var(--fm-border)" }}>
            <div style={{ width: `${Math.min(wagePct, 100)}%`, background: wageColor, height: "100%", borderRadius: "3px", transition: "width 0.5s" }} />
          </div>
          <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--fm-muted)" }}>
            <span>£0</span>
            <span>£{(finances.currentWeeklyWages ?? 0).toLocaleString()}k pw current</span>
            <span>£{(finances.wageBudget ?? 0).toLocaleString()}k pw budget</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {sections.map(section => (
            <div key={section.title} className="fm-panel">
              <div className="fm-section-header" style={{ fontSize: "10px", padding: "6px 12px" }}>{section.title}</div>
              <div className="divide-y" style={{ borderColor: "var(--fm-border)" }}>
                {section.items.map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />}
                      <span className="text-xs" style={{ color: "var(--fm-muted)" }}>{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
