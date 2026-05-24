import { useGetLeagueStandings, useGetSeasonStats } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function League() {
  const { data: league, isLoading: leagueLoading } = useGetLeagueStandings();
  const { data: stats, isLoading: statsLoading } = useGetSeasonStats();

  if (leagueLoading || statsLoading) return <div className="p-8">Loading league data...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{league?.leagueName || "League Table"}</h1>
        <p className="text-muted-foreground mt-2">Season {league?.season} • Week {league?.currentWeek}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[50px] text-center">Pos</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-center w-[50px]">P</TableHead>
                    <TableHead className="text-center w-[50px]">W</TableHead>
                    <TableHead className="text-center w-[50px]">D</TableHead>
                    <TableHead className="text-center w-[50px]">L</TableHead>
                    <TableHead className="text-center w-[50px]">GF</TableHead>
                    <TableHead className="text-center w-[50px]">GA</TableHead>
                    <TableHead className="text-center w-[50px]">GD</TableHead>
                    <TableHead className="text-center font-bold w-[50px]">Pts</TableHead>
                    <TableHead className="w-[120px]">Form</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {league?.standings.map((team) => (
                    <TableRow key={team.clubId} className={`border-border ${team.isPlayerClub ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'}`}>
                      <TableCell className="text-center font-medium">{team.position}</TableCell>
                      <TableCell className="font-bold">{team.clubName}</TableCell>
                      <TableCell className="text-center">{team.played}</TableCell>
                      <TableCell className="text-center">{team.won}</TableCell>
                      <TableCell className="text-center">{team.drawn}</TableCell>
                      <TableCell className="text-center">{team.lost}</TableCell>
                      <TableCell className="text-center">{team.goalsFor}</TableCell>
                      <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                      <TableCell className="text-center">{team.goalDifference}</TableCell>
                      <TableCell className="text-center font-bold">{team.points}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {team.form.map((result, i) => (
                            <div key={i} className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold ${result === 'W' ? 'bg-green-500 text-white' : result === 'D' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Top Scorers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topScorers.map((player, i) => (
                  <div key={player.playerId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-muted-foreground w-4 text-right">{i + 1}</div>
                      <div>
                        <div className="font-medium text-sm">{player.playerName}</div>
                        <div className="text-xs text-muted-foreground">{player.clubName}</div>
                      </div>
                    </div>
                    <div className="font-bold">{player.goals}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Top Assisters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topAssisters.map((player, i) => (
                  <div key={player.playerId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-muted-foreground w-4 text-right">{i + 1}</div>
                      <div>
                        <div className="font-medium text-sm">{player.playerName}</div>
                        <div className="text-xs text-muted-foreground">{player.clubName}</div>
                      </div>
                    </div>
                    <div className="font-bold">{player.assists}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
