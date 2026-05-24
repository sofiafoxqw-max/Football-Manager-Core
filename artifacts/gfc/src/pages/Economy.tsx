import { useGetEconomySummary, getGetEconomySummaryQueryKey, useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Building2, Users, Activity } from "lucide-react";

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function Economy() {
  const { data: economy, isLoading } = useGetEconomySummary({ query: { queryKey: getGetEconomySummaryQueryKey() } });
  const { data: transactions } = useListTransactions({}, { query: { queryKey: getListTransactionsQueryKey({}) } });

  const txTypeColor: Record<string, string> = {
    club_purchase: "text-blue-400",
    transfer: "text-emerald-400",
    salary: "text-amber-400",
    tax: "text-red-400",
    prize: "text-yellow-400",
    upgrade: "text-purple-400",
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Global Economy</h1>
          <Badge variant="outline" className="font-mono border-primary text-primary">10% TAX ON ALL TXS</Badge>
        </div>

        {isLoading && <div className="text-muted-foreground font-mono animate-pulse">LOADING...</div>}

        {economy && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Transfer Volume</div>
                  <div className="text-xl font-bold font-mono text-primary">{fmt(economy.totalTransferVolume)}</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Tax Pool</div>
                  <div className="text-xl font-bold font-mono text-red-400">{fmt(economy.taxPoolBalance)}</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><Building2 className="w-3 h-3" /> Active Clubs</div>
                  <div className="text-xl font-bold font-mono">{economy.totalClubs}</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Active Users</div>
                  <div className="text-xl font-bold font-mono">{economy.activeOwners + economy.activeCoaches}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2">Money in Circulation</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">{fmt(economy.totalMoneyInCirculation)}</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2">Transfers This Season</div>
                  <div className="text-lg font-bold font-mono">{economy.totalTransfersThisSeason}</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2">Tax Rate</div>
                  <div className="text-lg font-bold font-mono text-amber-400">{(economy.taxRate * 100).toFixed(0)}%</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {transactions && transactions.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {transactions.slice(0, 20).map((tx) => (
                  <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className={"font-mono text-xs shrink-0 border-current " + (txTypeColor[tx.type] ?? "")}>{tx.type.replace(/_/g, " ").toUpperCase()}</Badge>
                      <div className="text-sm truncate">{tx.description}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="font-mono text-sm font-bold">{fmt(tx.amount)}</div>
                      <div className="text-xs text-muted-foreground font-mono">{new Date(tx.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
