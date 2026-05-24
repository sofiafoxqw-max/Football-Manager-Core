import { useGetDashboard, getGetDashboardQueryKey, useGetActivity, getGetActivityQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, Trophy, DollarSign, Users, TrendingUp, Activity, Bell } from "lucide-react";

function fmt(n: number) { return `$${n.toLocaleString()}`; }

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const { data: dashboard, isLoading } = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const { data: activity } = useGetActivity({ query: { queryKey: getGetActivityQueryKey(), enabled: isLoaded && !!isSignedIn } });

  if (!isLoaded || isLoading) {
    return <Layout><div className="flex items-center justify-center h-64"><div className="text-muted-foreground font-mono animate-pulse">LOADING...</div></div></Layout>;
  }

  if (!dashboard) return <Layout><div className="text-muted-foreground">No data</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">{dashboard.displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono uppercase border-primary text-primary">{dashboard.role}</Badge>
              {dashboard.pendingOffers > 0 && (
                <Badge className="bg-amber-500 text-black font-mono">
                  <Bell className="w-3 h-3 mr-1" /> {dashboard.pendingOffers} Offer{dashboard.pendingOffers > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          {!dashboard.hasClub && dashboard.role === "owner" && (
            <Link href="/clubs">
              <Button className="font-mono">BUY A CLUB</Button>
            </Link>
          )}
          {!dashboard.hasClub && dashboard.role === "coach" && (
            <Link href="/contracts">
              <Button variant="outline" className="font-mono">VIEW OFFERS</Button>
            </Link>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Balance</div>
              <div className="text-2xl font-bold font-mono text-primary">{fmt(dashboard.balance)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Reputation</div>
              <div className="text-2xl font-bold font-mono text-foreground">{dashboard.reputation}</div>
            </CardContent>
          </Card>
          {dashboard.hasClub && (
            <>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><Trophy className="w-3 h-3" /> League Pos</div>
                  <div className="text-2xl font-bold font-mono text-foreground">{dashboard.leaguePosition ?? '—'}</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Squad</div>
                  <div className="text-2xl font-bold font-mono text-foreground">{dashboard.squadSize ?? '—'}</div>
                </CardContent>
              </Card>
            </>
          )}
          {!dashboard.hasClub && (
            <>
              <Card className="bg-card border-border col-span-2">
                <CardContent className="p-5 flex items-center gap-4">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <div className="font-bold">No Club Yet</div>
                    <div className="text-sm text-muted-foreground">
                      {dashboard.role === "owner" ? "Browse the market and acquire your first club" : "Wait for an owner to send you a contract offer"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Club Summary */}
        {dashboard.hasClub && (
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Club Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Club</div>
                  <div className="font-bold">{dashboard.clubName}</div>
                  <div className="text-sm text-muted-foreground">{dashboard.leagueName}</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Points</div>
                  <div className="font-bold font-mono text-2xl">{dashboard.points ?? 0}</div>
                </div>
                {dashboard.clubValue && (
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Club Value</div>
                    <div className="font-bold font-mono">{fmt(dashboard.clubValue)}</div>
                  </div>
                )}
                {dashboard.transferBudget && (
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Transfer Budget</div>
                    <div className="font-bold font-mono text-emerald-400">{fmt(dashboard.transferBudget)}</div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link href="/my-club">
                  <Button variant="outline" size="sm" className="font-mono">VIEW CLUB</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Feed */}
        {activity && activity.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activity.slice(0, 8).map((item) => (
                  <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm">{item.description}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                    {item.amount && (
                      <div className="font-mono text-sm text-primary shrink-0">{fmt(item.amount)}</div>
                    )}
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
