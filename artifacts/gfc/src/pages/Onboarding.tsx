import { useRegisterUser, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Building2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { RegisterInputRole } from "@workspace/api-client-react";

const schema = z.object({
  displayName: z.string().min(3).max(20),
  role: z.enum([RegisterInputRole.owner, RegisterInputRole.coach]),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const register = useRegisterUser();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      role: RegisterInputRole.owner,
    },
  });

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  if (me && me.role !== "unregistered") {
    setLocation("/dashboard");
    return null;
  }

  const onSubmit = (data: z.infer<typeof schema>) => {
    register.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter uppercase text-primary">Establish Your Identity</h1>
          <p className="text-muted-foreground">Welcome to Global Football Capital. Choose your path.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="max-w-md mx-auto">
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12 bg-card border-border font-mono text-lg text-center uppercase" placeholder="ENTER NAME" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <>
                    <FormItem>
                      <FormControl>
                        <Card 
                          className={`p-6 cursor-pointer transition-all border-2 hover:border-primary/50 ${field.value === 'owner' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                          onClick={() => field.onChange('owner')}
                        >
                          <div className="flex flex-col items-center text-center space-y-4">
                            <Building2 className={`w-12 h-12 ${field.value === 'owner' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div>
                              <h3 className="text-xl font-bold uppercase tracking-tighter">Owner</h3>
                              <p className="text-sm text-muted-foreground mt-2">
                                Venture capitalists of the football world. Buy clubs, build stadiums, manage the budget, hire and fire coaches.
                              </p>
                            </div>
                          </div>
                        </Card>
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormControl>
                        <Card 
                          className={`p-6 cursor-pointer transition-all border-2 hover:border-primary/50 ${field.value === 'coach' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                          onClick={() => field.onChange('coach')}
                        >
                          <div className="flex flex-col items-center text-center space-y-4">
                            <Presentation className={`w-12 h-12 ${field.value === 'coach' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div>
                              <h3 className="text-xl font-bold uppercase tracking-tighter">Coach</h3>
                              <p className="text-sm text-muted-foreground mt-2">
                                Tactical masterminds. Negotiate contracts with owners, manage squads, win games, build your reputation.
                              </p>
                            </div>
                          </div>
                        </Card>
                      </FormControl>
                    </FormItem>
                  </>
                )}
              />
            </div>

            <div className="flex justify-center pt-8">
              <Button type="submit" size="lg" className="h-14 px-12 text-lg font-bold w-full max-w-md" disabled={register.isPending}>
                {register.isPending ? "INITIALIZING..." : "ENTER THE MARKET"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
