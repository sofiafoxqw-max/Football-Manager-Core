import { useListLeagues, getListLeaguesQueryKey, useGetLeague, getGetLeagueQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Building2, DollarSign, Users } from "lucide-react";

function fmt(n: number) { return "$" + n.toLocaleString(); }

function LeagueTable({ leagueId }: { leagueId: number }) {
  const { data: league, isLoading } = useGetLeague(leagueId, { query: { queryKey: getGetLeagueQueryKey(leagueId) } });
  if (isLoading) return <div className="text-muted-foreground font-mono text-sm animate-pulse p-4">LOADING STANDINGS...</div>;
  if (!league?.standings?.length) return <div className="text-muted-foreground text-sm p-4">No standings yet</div>;
  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-12 px-4 py-2 text-xs font-mono text-muted-foreground uppercase">
        <span className="col-span-1">#</span>
        <span className="col-span-5">Club</span>
        <span className="col-span-2 text-center">P</span>
        <span className="col-span-2 text-center">W-D-L</span>
        <span className="col-span-2 text-center">Pts</span>
      </div>
      {league.standings.map((row, i) => (
        <div key={row.clubId} className={`grid grid-cols-12 px-4 py-3 text-sm ${i === 0 ? "bg-primary/5" : ""}`}>
          <span className="col-span-1 font-mono text-muted-foreground">{i + 1}</span>
          <span className="col-span-5 font-bold truncate">{row.clubName}</span>
          <span className="col-span-2 text-center font-mono">{row.played}</span>
          <span className="col-span-2 text-center font-mono text-muted-foreground text-xs">{row.wins}-{row.draws}-{row.losses}</span>
          <span className="col-span-2 text-center font-mono font-bold text-primary">{row.points}</span>
        </div>
      ))}
    </div>
  );
}

export default function Leagues() {
  const { data: leagues, isLoading } = useListLeagues({ query: { queryKey: getListLeaguesQueryKey() } });
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tighter uppercase">Leagues</h1>
        {isLoading && <div className="text-muted-foreground font-mono animate-pulse">LOADING...</div>}
        <div className="grid md:grid-cols-2 gap-4">
          {leagues?.map((league) => (
            <Card key={league.id} className={`bg-card border-border cursor-pointer transition-all hover:border-primary/40 ${selected === league.id ? "border-primary" : ""}`} onClick={() => setSelected(selected === league.id ? null : league.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-bold">{league.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">{league.country}</div>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">Tier {league.tier}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Entry Fee:</span>
                    <span className="font-mono">{fmt(league.entryFee)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    <span className="text-muted-foreground">Prize:</span>
                    <span className="font-mono text-yellow-400">{fmt(league.prizePool)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Clubs:</span>
                    <span className="font-mono">{league.totalClubs}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Owners:</span>
                    <span className="font-mono">{league.activeOwners}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="font-mono text-xs w-full border border-border">
                  {selected === league.id ? "HIDE STANDINGS" : "VIEW STANDINGS"}
                </Button>
              </CardContent>
              {selected === league.id && (
                <div className="border-t border-border">
                  <LeagueTable leagueId={league.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
