import { useListClubs, getListClubsQueryKey, useListLeagues, getListLeaguesQueryKey, useGetMe, getGetMeQueryKey, useBuyClub } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Users, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function Clubs() {
  const { isSignedIn, isLoaded } = useAuth();
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const { data: leagues } = useListLeagues({ query: { queryKey: getListLeaguesQueryKey() } });
  const params = {
    ...(leagueFilter !== "all" ? { leagueId: parseInt(leagueFilter) } : {}),
    ...(availableOnly ? { available: true } : {}),
  };
  const { data: clubs, isLoading } = useListClubs(params, { query: { queryKey: getListClubsQueryKey(params) } });
  const buyClub = useBuyClub();

  function handleBuy(clubId: number, name: string) {
    buyClub.mutate({ id: clubId }, {
      onSuccess: () => {
        toast({ title: "Club Acquired", description: "You now own " + name });
        queryClient.invalidateQueries({ queryKey: getListClubsQueryKey(params) });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed to acquire club", variant: "destructive" }),
    });
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Clubs Market</h1>
          <div className="flex items-center gap-3">
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-48 font-mono bg-card border-border">
                <SelectValue placeholder="All Leagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                {leagues?.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={availableOnly ? "default" : "outline"} size="sm" className="font-mono" onClick={() => setAvailableOnly(!availableOnly)}>
              {availableOnly ? "AVAILABLE ONLY" : "ALL CLUBS"}
            </Button>
          </div>
        </div>
        {isLoading && <div className="text-muted-foreground font-mono animate-pulse">LOADING...</div>}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clubs?.map((club) => (
            <Card key={club.id} className="bg-card border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-bold text-base">{club.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">{club.city}, {club.country}</div>
                  </div>
                  <div>
                    {club.ownerId ? (
                      <Badge variant="outline" className="text-xs shrink-0">Owned</Badge>
                    ) : (
                      <Badge className="text-xs shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Available</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Price</div>
                    <div className="font-mono font-bold text-primary">{fmt(club.purchasePrice)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Prestige</div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="font-mono font-bold">{club.prestige}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Transfer Budget</div>
                    <div className="font-mono text-sm">{fmt(club.transferBudget)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">League</div>
                    <div className="text-sm truncate">{club.leagueName}</div>
                  </div>
                </div>
                {club.ownerName && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {club.ownerName}
                  </div>
                )}
                {club.coachName && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {club.coachName}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Link href={"/clubs/" + club.id} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full font-mono">DETAILS</Button>
                  </Link>
                  {me?.role === "owner" && !club.ownerId && !me.clubId && (
                    <Button size="sm" className="font-mono" onClick={() => handleBuy(club.id, club.name)} disabled={buyClub.isPending}>
                      BUY
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {clubs?.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground font-mono">NO CLUBS MATCH YOUR FILTERS</div>
        )}
      </div>
    </Layout>
  );
}
