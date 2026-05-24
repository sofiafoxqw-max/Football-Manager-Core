import { useGetFinances } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Finances() {
  const { data: finances, isLoading } = useGetFinances();

  if (isLoading) return <div className="p-8">Loading financials...</div>;
  if (!finances) return null;

  const wageUsagePct = (finances.currentWeeklyWages / finances.wageBudget) * 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Finances</h1>
        <p className="text-muted-foreground mt-2">Club treasury, budgets, and revenue tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Club Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${finances.balance < 0 ? 'text-red-500' : ''}`}>
              £{finances.balance.toLocaleString()}k
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Transfer Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{finances.transferBudget.toLocaleString()}k</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Wage Budget (Weekly)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">£{finances.wageBudget.toLocaleString()}k</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used: £{finances.currentWeeklyWages.toLocaleString()}k</span>
                <span>{wageUsagePct.toFixed(1)}%</span>
              </div>
              <Progress value={wageUsagePct} className={`h-2 ${wageUsagePct > 90 ? 'bg-red-900' : ''}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle>Season Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="font-bold text-green-500">£{finances.seasonRevenue.toLocaleString()}k</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Matchday Income</span>
              <span className="font-medium">£{finances.matchdayRevenue.toLocaleString()}k</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Sponsorships</span>
              <span className="font-medium">£{finances.sponsorshipRevenue.toLocaleString()}k</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Transfer Sales</span>
              <span className="font-medium">£{finances.transferIncome.toLocaleString()}k</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle>Season Expenditure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total Expenditure</span>
              <span className="font-bold text-red-500">£{finances.seasonExpenditure.toLocaleString()}k</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Player Wages</span>
              <span className="font-medium">£{(finances.currentWeeklyWages * 52).toLocaleString()}k (Est. Annual)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Transfer Purchases</span>
              <span className="font-medium">£{finances.transferSpend.toLocaleString()}k</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
