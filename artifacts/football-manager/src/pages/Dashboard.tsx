import { useGetGameState, useGetFinances, useListFixtures, useAdvanceGame, getGetGameStateQueryKey, getListFixturesQueryKey, getGetFinancesQueryKey, getGetLeagueStandingsQueryKey, getGetSquadQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Trophy, ArrowRight, DollarSign, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: gameState } = useGetGameState();
  const { data: finances } = useGetFinances();
  const { data: fixtures } = useListFixtures();
  const advanceGame = useAdvanceGame();
  const queryClient = useQueryClient();

  const handleAdvance = () => {
    advanceGame.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListFixturesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeagueStandingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSquadQueryKey() });
      }
    });
  };

  const nextFixture = fixtures?.find(f => f.status === 'scheduled');
  const recentFixtures = fixtures?.filter(f => f.status === 'completed').slice(-3);

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Manager Hub</h1>
          <p className="text-muted-foreground mt-2">{gameState.clubName} • Season {gameState.season}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-4">
            <div className="font-semibold text-lg">{gameState.currentDate}</div>
            <div className="text-sm text-muted-foreground">Week {gameState.currentWeek} of {gameState.totalWeeks}</div>
          </div>
          <Button size="lg" onClick={handleAdvance} disabled={advanceGame.isPending}>
            {advanceGame.isPending ? "Simulating..." : "Advance Week"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">League Position</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameState.leaguePosition || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">{gameState.points || 0} Points</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Fixture</CardTitle>
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextFixture ? (
              <>
                <div className="text-lg font-bold truncate">
                  {nextFixture.isPlayerClubHome ? nextFixture.awayClubName : nextFixture.homeClubName}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {nextFixture.isPlayerClubHome ? '(H)' : '(A)'} • {nextFixture.date}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No upcoming fixtures</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transfer Budget</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(finances?.transferBudget || 0).toLocaleString()}k</div>
            <p className="text-xs text-muted-foreground mt-1">Wage Budget: £{(finances?.wageBudget || 0).toLocaleString()}k</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Form</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {recentFixtures?.length ? recentFixtures.map(f => {
                const isHome = f.isPlayerClubHome;
                const playerGoals = isHome ? f.homeScore : f.awayScore;
                const oppGoals = isHome ? f.awayScore : f.homeScore;
                const result = playerGoals! > oppGoals! ? 'W' : playerGoals === oppGoals ? 'D' : 'L';
                return (
                  <div key={f.id} className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${result === 'W' ? 'bg-green-500/20 text-green-500' : result === 'D' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                    {result}
                  </div>
                );
              }) : <div className="text-sm text-muted-foreground">No recent matches</div>}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Results</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/fixtures">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFixtures?.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                    <div className={`w-1/3 text-right font-medium ${f.isPlayerClubHome ? 'text-primary' : ''}`}>{f.homeClubName}</div>
                    <div className="w-1/3 text-center font-bold px-4 py-1 bg-muted rounded-md">{f.homeScore} - {f.awayScore}</div>
                    <div className={`w-1/3 text-left font-medium ${f.isPlayerClubAway ? 'text-primary' : ''}`}>{f.awayClubName}</div>
                  </div>
                ))}
                {!recentFixtures?.length && <div className="text-center text-muted-foreground py-4">No completed fixtures yet.</div>}
              </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
