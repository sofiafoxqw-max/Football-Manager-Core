import { useGetTransferMarket, getGetTransferMarketQueryKey, usePlaceBid, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store, TrendingUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function Transfers() {
  const { isSignedIn, isLoaded } = useAuth();
  const [bidAmount, setBidAmount] = useState<Record<number, string>>({});
  const [openDialog, setOpenDialog] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const { data: listings, isLoading } = useGetTransferMarket({}, { query: { queryKey: getGetTransferMarketQueryKey({}) } });
  const placeBid = usePlaceBid();

  function handleBid(listingId: number) {
    const amount = parseInt(bidAmount[listingId] ?? "0");
    placeBid.mutate({ data: { listingId, bidAmount: amount } }, {
      onSuccess: () => {
        toast({ title: "Bid Placed", description: "Your bid of " + fmt(amount) + " submitted" });
        queryClient.invalidateQueries({ queryKey: getGetTransferMarketQueryKey({}) });
        setOpenDialog(null);
        setBidAmount((prev) => ({ ...prev, [listingId]: "" }));
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
    });
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Transfer Market</h1>
          {listings && <div className="text-muted-foreground font-mono text-sm">{listings.length} LISTINGS</div>}
        </div>
        {isLoading && <div className="text-muted-foreground font-mono animate-pulse">LOADING...</div>}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings?.map((listing) => (
            <Card key={listing.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold">{listing.playerName}</div>
                    <div className="text-xs text-muted-foreground">{listing.position} · OVR {listing.overall}</div>
                  </div>
                  <Badge className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" /> For Sale
                  </Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Asking Price</span>
                    <span className="font-mono font-bold text-primary">{fmt(listing.askingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Age</span>
                    <span className="font-mono">{listing.age} yrs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seller Club</span>
                    <span className="text-xs truncate max-w-32">{listing.fromClubName}</span>
                  </div>
                </div>
                <div className="text-xs text-amber-400/70 font-mono mb-3">10% tax applies on all transfers</div>
                {me?.clubId && listing.fromClubId !== me.clubId && (
                  <Dialog open={openDialog === listing.id} onOpenChange={(open) => { if (!open) setOpenDialog(null); }}>
                    <DialogTrigger asChild>
                      <Button className="w-full font-mono" size="sm" onClick={() => setOpenDialog(listing.id)}>PLACE BID</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="font-mono uppercase">Bid for {listing.playerName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 font-mono">Asking: {fmt(listing.askingPrice)}</div>
                          <Input className="bg-background border-border font-mono" placeholder="Your bid amount" type="number" value={bidAmount[listing.id] ?? ""} onChange={(e) => setBidAmount((prev) => ({ ...prev, [listing.id]: e.target.value }))} />
                          <div className="text-xs text-amber-400 mt-1 font-mono">10% tax will be added to bid total</div>
                        </div>
                        <Button className="w-full font-mono" onClick={() => handleBid(listing.id)} disabled={placeBid.isPending}>
                          {placeBid.isPending ? "SUBMITTING..." : "SUBMIT BID"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {listings?.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground font-mono flex flex-col items-center gap-3">
            <Store className="w-12 h-12" />
            NO TRANSFER LISTINGS
          </div>
        )}
      </div>
    </Layout>
  );
}
