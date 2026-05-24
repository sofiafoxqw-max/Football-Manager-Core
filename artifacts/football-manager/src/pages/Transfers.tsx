import { useGetTransferMarket, useListTransfers } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Transfers() {
  const { data: market, isLoading: marketLoading } = useGetTransferMarket();
  const { data: history, isLoading: historyLoading } = useListTransfers();

  if (marketLoading || historyLoading) return <div className="p-8">Loading transfers...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Transfer Network</h1>
        <p className="text-muted-foreground mt-2">Scout players and manage club transactions.</p>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 mb-8">
          <TabsTrigger value="market">Transfer Market</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="market">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Player</TableHead>
                    <TableHead>Pos</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>OVR</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-right">Asking Price</TableHead>
                    <TableHead className="text-right">Wage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {market?.map((listing) => (
                    <TableRow key={listing.playerId} className="border-border hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-bold">{listing.playerName}</TableCell>
                      <TableCell>{listing.position}</TableCell>
                      <TableCell>{listing.age}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{listing.overall}</Badge>
                      </TableCell>
                      <TableCell>{listing.clubName}</TableCell>
                      <TableCell className="text-right font-medium text-primary">£{listing.askingPrice.toLocaleString()}k</TableCell>
                      <TableCell className="text-right">£{listing.weeklySalary.toLocaleString()}k</TableCell>
                    </TableRow>
                  ))}
                  {!market?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">No players listed on the market.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history?.map((transfer) => (
                    <TableRow key={transfer.id} className="border-border hover:bg-muted/50">
                      <TableCell className="text-muted-foreground text-sm">{transfer.date}</TableCell>
                      <TableCell className="font-bold">{transfer.playerName}</TableCell>
                      <TableCell>{transfer.fromClubName}</TableCell>
                      <TableCell>{transfer.toClubName}</TableCell>
                      <TableCell className="text-right font-medium text-primary">£{transfer.fee.toLocaleString()}k</TableCell>
                    </TableRow>
                  ))}
                  {!history?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">No transfer history available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
