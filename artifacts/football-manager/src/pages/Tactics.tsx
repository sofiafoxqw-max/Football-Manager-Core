import { useGetTactics, useUpdateTactics, useGetSquad, getGetTacticsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TacticsInputFormation, TacticsInputMentality } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Tactics() {
  const { data: tactics, isLoading: tacticsLoading } = useGetTactics();
  const { data: squad, isLoading: squadLoading } = useGetSquad();
  const updateTactics = useUpdateTactics();
  const queryClient = useQueryClient();

  const [formation, setFormation] = useState<TacticsInputFormation>("4-3-3");
  const [mentality, setMentality] = useState<TacticsInputMentality>("balanced");
  const [pressing, setPressing] = useState(5);
  const [tempo, setTempo] = useState(5);
  const [width, setWidth] = useState(5);

  useEffect(() => {
    if (tactics) {
      setFormation(tactics.formation as TacticsInputFormation);
      setMentality(tactics.mentality as TacticsInputMentality);
      setPressing(tactics.pressing);
      setTempo(tactics.tempo);
      setWidth(tactics.width);
    }
  }, [tactics]);

  const handleSave = () => {
    if (!tactics) return;
    
    updateTactics.mutate({
      data: {
        formation,
        mentality,
        pressing,
        tempo,
        width,
        startingXI: tactics.startingXI,
        captainId: tactics.captainId
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTacticsQueryKey() });
        toast.success("Tactics saved");
      }
    });
  };

  if (tacticsLoading || squadLoading) return <div className="p-8">Loading tactics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Tactics</h1>
          <p className="text-muted-foreground mt-2">Set your formation, instructions and starting XI.</p>
        </div>
        <Button onClick={handleSave} disabled={updateTactics.isPending}>
          {updateTactics.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Pitch Visualization Placeholder */}
          <Card className="bg-card/50 border-border h-[600px] flex items-center justify-center overflow-hidden relative border-2">
             <div className="absolute inset-0 bg-green-800/40 opacity-50 pointer-events-none flex flex-col justify-between">
               {/* Pitch lines */}
               <div className="border border-white/20 w-full h-[100px]" />
               <div className="border border-white/20 w-1/3 mx-auto h-[100px] border-t-0" />
               <div className="border border-white/20 w-1/3 mx-auto h-[100px] border-b-0 mt-auto" />
             </div>
             <div className="text-muted-foreground z-10 font-mono">PITCH VISUALIZATION ({formation})</div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Team Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Formation</Label>
                <Select value={formation} onValueChange={(v) => setFormation(v as TacticsInputFormation)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select formation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4-3-3">4-3-3</SelectItem>
                    <SelectItem value="4-4-2">4-4-2</SelectItem>
                    <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                    <SelectItem value="3-5-2">3-5-2</SelectItem>
                    <SelectItem value="5-3-2">5-3-2</SelectItem>
                    <SelectItem value="4-5-1">4-5-1</SelectItem>
                    <SelectItem value="3-4-3">3-4-3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mentality</Label>
                <Select value={mentality} onValueChange={(v) => setMentality(v as TacticsInputMentality)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mentality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defensive">Defensive</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="attacking">Attacking</SelectItem>
                    <SelectItem value="gegenpressing">Gegenpressing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Pressing Intensity</Label>
                    <span className="text-xs text-muted-foreground">{pressing}/10</span>
                  </div>
                  <Slider value={[pressing]} min={1} max={10} step={1} onValueChange={(v) => setPressing(v[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tempo</Label>
                    <span className="text-xs text-muted-foreground">{tempo}/10</span>
                  </div>
                  <Slider value={[tempo]} min={1} max={10} step={1} onValueChange={(v) => setTempo(v[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Width</Label>
                    <span className="text-xs text-muted-foreground">{width}/10</span>
                  </div>
                  <Slider value={[width]} min={1} max={10} step={1} onValueChange={(v) => setWidth(v[0])} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
