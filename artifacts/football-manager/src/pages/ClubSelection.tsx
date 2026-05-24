import { useListClubs, useSetupGame, getGetGameStateQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ClubSelection() {
  const { data: clubs, isLoading } = useListClubs();
  const setupGame = useSetupGame();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [managerName, setManagerName] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

  const handleStart = () => {
    if (!managerName.trim()) {
      toast({ title: "Name required", description: "Please enter your manager name.", variant: "destructive" });
      return;
    }
    if (!selectedClubId) {
      toast({ title: "Club required", description: "Please select a club.", variant: "destructive" });
      return;
    }

    setupGame.mutate(
      { data: { clubId: selectedClubId, managerName } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to start game.", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading clubs...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">New Career</h1>
          <p className="text-muted-foreground mt-2">Select your club and begin your managerial journey.</p>
        </div>

        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="max-w-sm space-y-2">
              <Label htmlFor="managerName">Manager Name</Label>
              <Input
                id="managerName"
                placeholder="Enter your name..."
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs?.map((club) => (
            <Card 
              key={club.id} 
              className={`cursor-pointer transition-all ${selectedClubId === club.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedClubId(club.id)}
            >
              <CardHeader className="space-y-1 relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-24 h-24 opacity-20 -mr-8 -mt-8 rounded-full" 
                  style={{ backgroundColor: club.colors || '#fff' }}
                />
                <CardTitle className="text-xl">{club.name}</CardTitle>
                <CardDescription>{club.leagueName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {club.city}, {club.country}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {club.stadiumName} ({club.stadiumCapacity.toLocaleString()})
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Reputation: {Array(club.reputation).fill('★').join('')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end sticky bottom-8">
          <Button size="lg" onClick={handleStart} disabled={setupGame.isPending}>
            {setupGame.isPending ? "Starting..." : "Take Charge"}
          </Button>
        </div>
      </div>
    </div>
  );
}
