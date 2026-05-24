import { useGetClub, getGetClubQueryKey, useGetMe, getGetMeQueryKey, useBuyClub } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Star, Users, Trophy, Shield, DollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  const { isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clubId = parseInt(id!);
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const { data: club, isLoading } = useGetClub(clubId, { query: { queryKey: getGetClubQueryKey(clubId) } });
  const buyClub = useBuyClub();

  function handleBuy() {
    if (!club) return;
    buyClub.mutate({ id: clubId }, {
      onSuccess: () => {
        toast({ title: "Club Acquired", description: "You now own " + club.name });
        queryClient.invalidateQueries({ queryKey: getGetClubQueryKey(clubId) });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
    });
  }

  if (isLoading || !club) {
    return <Layout><div className="flex items-center justify-center h-64"><div className="text-muted-foreground font-mono animate-pulse">LOADING...</div></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">{club.name}</h1>
            <div className="text-muted-foreground mt-1">{club.city}, {club.country} — {club.leagueName}</div>
          </div>
          <div className="flex items-center gap-2">
            {!club.ownerId ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Available</Badge>
            ) : (
              <Badge variant="outline">Owned</Badge>
            )}
            {me?.role === "owner" && !club.ownerId && !me.clubId && (
              <Button className="font-mono" onClick={handleBuy} disabled={buyClub.isPending}>
                {buyClub.isPending ? "BUYING..." : "BUY CLUB — " + fmt(club.purchasePrice)}
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Purchase Price</div>
              <div className="text-2xl font-bold font-mono text-primary">{fmt(club.purchasePrice)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> Prestige</div>
              <div className="text-2xl font-bold font-mono">{club.prestige} / 10</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Transfer Budget</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{fmt(club.transferBudget)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Club Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Stadium Capacity</span>
                <span className="font-mono font-bold">{club.stadiumCapacity?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Stadium Level</span>
                <span className="font-mono font-bold">{club.stadiumLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Training Level</span>
                <span className="font-mono font-bold">{club.trainingLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Youth Academy Level</span>
                <span className="font-mono font-bold">{club.academyLevel}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Personnel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-mono mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Owner</div>
                <div className="font-bold">{club.ownerName ?? <span className="text-muted-foreground italic">None</span>}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-mono mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Coach</div>
                <div className="font-bold">{club.coachName ?? <span className="text-muted-foreground italic">None</span>}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-mono mb-1 flex items-center gap-1"><Trophy className="w-3 h-3" /> League Position</div>
                <div className="font-bold font-mono">{club.leaguePosition ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Points</div>
                <div className="font-bold font-mono">{club.points ?? 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {club.players && club.players.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Squad ({club.players.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {club.players.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold">{p.name}</span>
                      <span className="text-muted-foreground text-sm ml-3">{p.position}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-muted-foreground">OVR <span className="font-mono font-bold text-foreground">{p.overall}</span></div>
                      <div className="text-xs text-muted-foreground font-mono">{fmt(p.marketValue)}</div>
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
