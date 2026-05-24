import { useGetMyClub, getGetMyClubQueryKey, useGetMe, getGetMeQueryKey, useHireCoach, useFireCoach, useUpgradeClub } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Users, TrendingUp, DollarSign, Zap, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) { return "$" + n.toLocaleString(); }

const INFRA_TYPES = [
  { key: "stadium", label: "Stadium", icon: Building2 },
  { key: "training", label: "Training", icon: Zap },
  { key: "academy", label: "Youth Academy", icon: Users },
];

export default function MyClub() {
  const { isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hireCoachId, setHireCoachId] = useState("");
  const [hireOpen, setHireOpen] = useState(false);

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const { data: club, isLoading } = useGetMyClub({ query: { queryKey: getGetMyClubQueryKey(), enabled: isLoaded && !!isSignedIn } });

  const hireCoach = useHireCoach();
  const fireCoach = useFireCoach();
  const upgradeClub = useUpgradeClub();

  function handleHire() {
    if (!club || !hireCoachId) return;
    hireCoach.mutate({ id: club.id, data: { coachUserId: hireCoachId } }, {
      onSuccess: () => {
        toast({ title: "Coach Hired" });
        queryClient.invalidateQueries({ queryKey: getGetMyClubQueryKey() });
        setHireOpen(false);
        setHireCoachId("");
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
    });
  }

  function handleFire() {
    if (!club) return;
    fireCoach.mutate({ id: club.id }, {
      onSuccess: () => {
        toast({ title: "Coach Fired" });
        queryClient.invalidateQueries({ queryKey: getGetMyClubQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
    });
  }

  function handleUpgrade(infraType: string) {
    if (!club) return;
    upgradeClub.mutate({ id: club.id, data: { upgradeType: infraType } }, {
      onSuccess: () => {
        toast({ title: "Upgraded!", description: infraType.replace(/_/g, " ") + " upgraded" });
        queryClient.invalidateQueries({ queryKey: getGetMyClubQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
    });
  }

  if (isLoading) return <Layout><div className="flex items-center justify-center h-64"><div className="text-muted-foreground font-mono animate-pulse">LOADING...</div></div></Layout>;
  if (!club) return <Layout><div className="text-center py-20 text-muted-foreground font-mono">NO CLUB FOUND — BUY A CLUB FROM THE CLUBS MARKET</div></Layout>;

  const isOwner = me?.role === "owner";

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">{club.name}</h1>
            <div className="text-muted-foreground mt-1">{club.city}, {club.country} — {club.leagueName}</div>
          </div>
          <Badge variant="outline" className="font-mono text-primary border-primary">{isOwner ? "OWNER VIEW" : "COACH VIEW"}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Transfer Budget</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{fmt(club.transferBudget)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Points</div>
              <div className="text-xl font-bold font-mono">{club.points ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2">League Pos</div>
              <div className="text-xl font-bold font-mono">{club.leaguePosition ?? "—"}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Squad</div>
              <div className="text-xl font-bold font-mono">{club.players?.length ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Personnel</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Coach</div>
                  <div className="font-bold">{club.coachName ?? <span className="text-muted-foreground italic text-sm">No coach hired</span>}</div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    {club.coachName ? (
                      <Button variant="destructive" size="sm" className="font-mono" onClick={handleFire} disabled={fireCoach.isPending}>FIRE</Button>
                    ) : (
                      <Dialog open={hireOpen} onOpenChange={setHireOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="font-mono">HIRE</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader>
                            <DialogTitle className="font-mono uppercase">Hire Coach</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-muted-foreground font-mono mb-2">Enter the Coach's User ID (they must be registered as a coach)</div>
                              <Input className="bg-background border-border font-mono" placeholder="Coach User ID" value={hireCoachId} onChange={(e) => setHireCoachId(e.target.value)} />
                            </div>
                            <Button className="w-full font-mono" onClick={handleHire} disabled={hireCoach.isPending || !hireCoachId}>
                              {hireCoach.isPending ? "HIRING..." : "HIRE COACH"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>
              {club.ownerName && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Owner</div>
                  <div className="font-bold">{club.ownerName}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" /> Infrastructure</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {INFRA_TYPES.map(({ key, label, icon: Icon }) => {
                  const level = key === "stadium" ? club.stadiumLevel : key === "training" ? club.trainingLevel : club.academyLevel;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{label}</span>
                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Lv.{level}</span>
                      </div>
                      <Button size="sm" variant="outline" className="font-mono text-xs h-7" onClick={() => handleUpgrade(key)} disabled={upgradeClub.isPending}>UPGRADE</Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {club.players && club.players.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Squad ({club.players.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {club.players.map((p: any) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-bold">{p.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">{p.position}</Badge>
                      <span className="text-xs text-muted-foreground">Age {p.age}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono">OVR <strong>{p.overall}</strong></span>
                      <span className="font-mono text-muted-foreground">{fmt(p.marketValue)}</span>
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
