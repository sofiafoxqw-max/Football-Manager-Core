import { useGetEconomySummary, useGetLeaderboard, getGetEconomySummaryQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Activity, Trophy, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const { data: economy } = useGetEconomySummary({ query: { queryKey: getGetEconomySummaryQueryKey() } });
  const { data: leaderboard } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });

  if (isLoaded && isSignedIn) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <header className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">G</div>
          <span className="font-bold text-xl text-primary tracking-tighter">GLOBAL FOOTBALL CAPITAL</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost">Log In</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Start Building</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6 flex flex-col gap-12 mt-12">
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground uppercase">
            The Financial <span className="text-primary">Strategy</span> Game Wrapped in Football
          </h1>
          <p className="text-xl text-muted-foreground">
            Compete as an Owner building a global empire, or as a Coach managing tactical brilliance. Real economy, real stakes, 10% tax on everything.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 text-lg font-bold">
                Join the Market <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {economy && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-mono mb-2 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Volume
                </div>
                <div className="text-3xl font-bold font-mono text-primary">${economy.totalTransferVolume.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-mono mb-2 uppercase flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Clubs
                </div>
                <div className="text-3xl font-bold font-mono text-foreground">{economy.totalClubs}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-mono mb-2 uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Owners
                </div>
                <div className="text-3xl font-bold font-mono text-foreground">{economy.activeOwners}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-mono mb-2 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Coaches
                </div>
                <div className="text-3xl font-bold font-mono text-foreground">{economy.activeCoaches}</div>
              </CardContent>
            </Card>
          </section>
        )}

        {leaderboard && (
          <section className="grid md:grid-cols-2 gap-8 mt-8">
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="font-mono text-primary flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> Top Owners
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {leaderboard.topOwners.slice(0, 5).map((entry, i) => (
                    <div key={entry.userId} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground font-mono w-4">{i + 1}</span>
                        <span className="font-bold">{entry.displayName}</span>
                      </div>
                      <span className="font-mono text-primary">{entry.scoreLabel}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="font-mono text-primary flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> Top Coaches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {leaderboard.topCoaches.slice(0, 5).map((entry, i) => (
                    <div key={entry.userId} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground font-mono w-4">{i + 1}</span>
                        <span className="font-bold">{entry.displayName}</span>
                      </div>
                      <span className="font-mono text-primary">{entry.scoreLabel}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
