import { useListFixtures } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Fixtures() {
  const { data: fixtures, isLoading } = useListFixtures();

  if (isLoading) return <div className="p-8">Loading fixtures...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Fixtures & Results</h1>
        <p className="text-muted-foreground mt-2">Season schedule and match history.</p>
      </div>

      <div className="space-y-4">
        {fixtures?.map((fixture) => (
          <Card key={fixture.id} className="bg-card/50 border-border hover:bg-muted/30 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="w-1/4 text-sm text-muted-foreground">
                <span className="font-mono">Wk {fixture.week}</span> • {fixture.date}
              </div>
              
              <div className="flex-1 flex items-center justify-center gap-6">
                <div className={`flex-1 text-right font-semibold text-lg ${fixture.isPlayerClubHome ? 'text-primary' : ''}`}>
                  {fixture.homeClubName}
                </div>
                
                <div className="w-24 text-center">
                  {fixture.status === 'completed' ? (
                    <div className="font-bold text-xl px-4 py-1 bg-muted rounded-md border border-border">
                      {fixture.homeScore} - {fixture.awayScore}
                    </div>
                  ) : (
                    <Badge variant="outline" className="px-3">Upcoming</Badge>
                  )}
                </div>

                <div className={`flex-1 text-left font-semibold text-lg ${fixture.isPlayerClubAway ? 'text-primary' : ''}`}>
                  {fixture.awayClubName}
                </div>
              </div>

              <div className="w-1/4 text-right">
                {/* Extra info or actions here */}
              </div>
            </CardContent>
          </Card>
        ))}
        {!fixtures?.length && (
          <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-lg">
            No fixtures scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
