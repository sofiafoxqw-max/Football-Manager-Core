import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });

  const medalColor = (i: number) => i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-muted-foreground";

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tighter uppercase">Leaderboard</h1>
        {isLoading && <div className="text-muted-foreground font-mono animate-pulse">LOADING...</div>}
        <div className="grid md:grid-cols-2 gap-6">
          {leaderboard && (
            <>
              <Card className="bg-card border-border">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" /> Top Owners
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {leaderboard.topOwners.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground font-mono text-sm">NO OWNERS YET</div>
                  )}
                  <div className="divide-y divide-border">
                    {leaderboard.topOwners.map((entry, i) => (
                      <div key={entry.userId} className={`px-5 py-4 flex items-center justify-between gap-4 ${i === 0 ? "bg-yellow-400/5" : ""}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 text-center font-mono font-bold ${medalColor(i)}`}>
                            {i < 3 ? <Medal className="w-5 h-5 mx-auto" /> : i + 1}
                          </div>
                          <div>
                            <div className="font-bold">{entry.displayName}</div>
                            {entry.clubName && <div className="text-xs text-muted-foreground">{entry.clubName}</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-primary">{entry.scoreLabel}</div>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-400" /> Top Coaches
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {leaderboard.topCoaches.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground font-mono text-sm">NO COACHES YET</div>
                  )}
                  <div className="divide-y divide-border">
                    {leaderboard.topCoaches.map((entry, i) => (
                      <div key={entry.userId} className={`px-5 py-4 flex items-center justify-between gap-4 ${i === 0 ? "bg-emerald-400/5" : ""}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 text-center font-mono font-bold ${medalColor(i)}`}>
                            {i < 3 ? <Medal className="w-5 h-5 mx-auto" /> : i + 1}
                          </div>
                          <div>
                            <div className="font-bold">{entry.displayName}</div>
                            {entry.clubName && <div className="text-xs text-muted-foreground">{entry.clubName}</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400">{entry.scoreLabel}</div>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
