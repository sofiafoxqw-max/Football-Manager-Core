import { useListCoachOffers, getListCoachOffersQueryKey, useGetMe, getGetMeQueryKey, useRespondToCoachOffer, useHireCoach, getGetMyClubQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Bell, CheckCircle, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function Contracts() {
  const { isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isLoaded && !!isSignedIn } });
  const { data: myOffers } = useListCoachOffers({ query: { queryKey: getListCoachOffersQueryKey(), enabled: isLoaded && !!isSignedIn } });

  const respondToOffer = useRespondToCoachOffer();

  function handleRespond(offerId: number, accepted: boolean) {
    respondToOffer.mutate({ id: offerId, data: { accept: accepted } }, {
      onSuccess: () => {
        toast({ title: accepted ? "Offer Accepted" : "Offer Declined" });
        queryClient.invalidateQueries({ queryKey: getListCoachOffersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (accepted) queryClient.invalidateQueries({ queryKey: getGetMyClubQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
    });
  }

  const pendingOffers = myOffers?.filter((o) => o.status === "pending") ?? [];
  const pastOffers = myOffers?.filter((o) => o.status !== "pending") ?? [];

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Contracts & Offers</h1>
        </div>

        {me?.role === "coach" && (
          <>
            {pendingOffers.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" /> Pending Offers ({pendingOffers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pendingOffers.map((offer) => (
                      <div key={offer.id} className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-bold">{offer.clubName}</div>
                            <div className="text-sm text-muted-foreground">{offer.leagueName}</div>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-xs">PENDING</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase font-mono">Salary/Season</div>
                            <div className="font-mono font-bold text-emerald-400">{fmt(offer.weeklySalary)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase font-mono">Duration</div>
                            <div className="font-mono font-bold">{offer.contractWeeks} week{offer.contractWeeks > 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 font-mono bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => handleRespond(offer.id, true)} disabled={respondToOffer.isPending}>
                            <CheckCircle className="w-4 h-4 mr-1" /> ACCEPT
                          </Button>
                          <Button variant="destructive" className="flex-1 font-mono" size="sm" onClick={() => handleRespond(offer.id, false)} disabled={respondToOffer.isPending}>
                            <XCircle className="w-4 h-4 mr-1" /> DECLINE
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {pastOffers.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="font-mono text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Past Offers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pastOffers.map((offer) => (
                      <div key={offer.id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-sm">{offer.clubName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{fmt(offer.weeklySalary)}/season · {offer.contractWeeks}yr</div>
                        </div>
                        <Badge variant="outline" className={"font-mono text-xs " + (offer.status === "accepted" ? "border-emerald-500 text-emerald-400" : "border-red-500 text-red-400")}>
                          {offer.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingOffers.length === 0 && pastOffers.length === 0 && (
              <div className="text-center py-20 text-muted-foreground font-mono flex flex-col items-center gap-3">
                <FileText className="w-12 h-12" />
                NO CONTRACT OFFERS YET
                <div className="text-sm">Owners will send you offers when they want to hire you</div>
              </div>
            )}
          </>
        )}

        {me?.role === "owner" && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              As an owner, use the <strong>My Club</strong> page to hire and fire coaches directly from your club management panel.
            </p>
            {!me.clubId && (
              <div className="text-center py-20 text-muted-foreground font-mono">
                BUY A CLUB FIRST FROM THE CLUBS MARKET
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
