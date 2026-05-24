import { useListPlayers, getListPlayersQueryKey, useGetMe, getGetMeQueryKey, useListPlayerForTransfer, getGetTransferMarketQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) { return "$" + n.toLocaleString(); }

const POSITIONS = ["All", "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "CF", "ST"];

export default function Players() {
  const { isSignedIn, isLoaded } = useAuth();
  const [position, setPosition] = useState("All");
  const [search, setSearch] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const params = { ...(position !== "All" ? { position } : {}), ...(search ? { search } : {}) };
  const { data: players, isLoading } = useListPlayers(params, { query: { queryKey: getListPlayersQueryKey(params) } });
  const createListing = useListPlayerForTransfer();

  function handleList() {
    if (!selectedPlayer || !listingPrice) return;
    const price = parseInt(listingPrice);
    createListing.mutate({ data: { playerId: selectedPlayer, askingPrice: price } }, {
      onSuccess: () => {
        toast({ title: "Listed for Transfer" });
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(params) });
        queryClient.invalidateQueries({ queryKey: getGetTransferMarketQueryKey({}) });
        setSelectedPlayer(null);
        setListingPrice("");
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
    });
  }

  const positionColor: Record<string, string> = {
    GK: "text-yellow-400", CB: "text-blue-400", LB: "text-blue-300", RB: "text-blue-300",
    CDM: "text-purple-400", CM: "text-purple-400", CAM: "text-purple-300",
    LW: "text-emerald-400", RW: "text-emerald-400", CF: "text-red-400", ST: "text-red-400",
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Players</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 bg-card border-border w-48 font-mono" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="w-28 font-mono bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && <div className="text-muted-foreground font-mono animate-pulse">LOADING...</div>}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {players?.map((player) => (
            <Card key={player.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold">{player.name}</div>
                    <div className="text-xs text-muted-foreground">{player.nationality} · Age {player.age}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-sm ${positionColor[player.position] ?? "text-foreground"}`}>{player.position}</span>
                    <div className="bg-primary/10 text-primary font-mono font-bold text-lg px-2 py-1 rounded">{player.overall}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-mono">PAC</div>
                    <div className="font-mono font-bold text-sm">{player.pace}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-mono">SHO</div>
                    <div className="font-mono font-bold text-sm">{player.shooting}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-mono">PAS</div>
                    <div className="font-mono font-bold text-sm">{player.passing}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-mono">DRI</div>
                    <div className="font-mono font-bold text-sm">{player.dribbling}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-mono">DEF</div>
                    <div className="font-mono font-bold text-sm">{player.defending}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-mono">PHY</div>
                    <div className="font-mono font-bold text-sm">{player.physical}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Value</div>
                    <div className="font-mono text-sm font-bold text-emerald-400">{fmt(player.marketValue)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.clubName && <span className="text-xs text-muted-foreground truncate max-w-24">{player.clubName}</span>}
                    {player.onTransferList && <Badge className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">For Sale</Badge>}
                    {me?.role === "owner" && me.clubId && player.clubId === me.clubId && !player.onTransferList && (
                      <Dialog open={selectedPlayer === player.id} onOpenChange={(open) => { if (!open) setSelectedPlayer(null); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="font-mono text-xs h-7" onClick={() => setSelectedPlayer(player.id)}>LIST</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader><DialogTitle className="font-mono uppercase">List {player.name} for Transfer</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-2 font-mono">Market Value: {fmt(player.marketValue)}</div>
                              <Input className="bg-background border-border font-mono" placeholder="Asking price (e.g. 5000000)" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} type="number" />
                            </div>
                            <Button className="w-full font-mono" onClick={handleList} disabled={createListing.isPending}>
                              {createListing.isPending ? "LISTING..." : "LIST FOR TRANSFER"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {players?.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground font-mono flex flex-col items-center gap-3">
            <Users className="w-12 h-12" />
            NO PLAYERS FOUND
          </div>
        )}
      </div>
    </Layout>
  );
}
