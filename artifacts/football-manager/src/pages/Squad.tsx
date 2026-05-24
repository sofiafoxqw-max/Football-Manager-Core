import { useGetSquad } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Squad() {
  const { data: squad, isLoading } = useGetSquad();

  if (isLoading) return <div className="p-8">Loading squad...</div>;

  const getRatingColor = (overall: number) => {
    if (overall >= 90) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
    if (overall >= 80) return "bg-blue-500/20 text-blue-500 border-blue-500/50";
    if (overall >= 70) return "bg-green-500/20 text-green-500 border-green-500/50";
    if (overall >= 60) return "bg-yellow-600/20 text-yellow-600 border-yellow-600/50";
    return "bg-gray-500/20 text-gray-500 border-gray-500/50";
  };

  const getMoraleColor = (morale: string) => {
    switch (morale) {
      case 'excellent': return "bg-green-500";
      case 'good': return "bg-green-400";
      case 'okay': return "bg-yellow-500";
      case 'poor': return "bg-orange-500";
      case 'unhappy': return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">First Team Squad</h1>
        <p className="text-muted-foreground mt-2">Manage your players, monitor fitness, and track development.</p>
      </div>

      <Card className="bg-card/50 border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[50px]">Pos</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Nat</TableHead>
                <TableHead>OVR</TableHead>
                <TableHead>Morale</TableHead>
                <TableHead className="w-[100px]">Fitness</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Wage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {squad?.map((player) => (
                <TableRow key={player.id} className="border-border hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-medium">{player.position}</TableCell>
                  <TableCell className="font-bold">{player.name}</TableCell>
                  <TableCell>{player.age}</TableCell>
                  <TableCell>{player.nationality}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono ${getRatingColor(player.overall)}`}>
                      {player.overall}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getMoraleColor(player.morale)}`} />
                      <span className="capitalize text-xs">{player.morale}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={player.fitness} className="h-2" />
                      <span className="text-xs text-muted-foreground">{player.fitness}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{player.form.toFixed(1)}</TableCell>
                  <TableCell>£{player.value.toLocaleString()}k</TableCell>
                  <TableCell className="text-right">£{player.weeklySalary.toLocaleString()}k</TableCell>
                </TableRow>
              ))}
              {!squad?.length && (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    No players found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
