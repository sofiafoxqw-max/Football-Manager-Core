import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Clubs from "@/pages/Clubs";
import ClubDetail from "@/pages/ClubDetail";
import MyClub from "@/pages/MyClub";
import Players from "@/pages/Players";
import Transfers from "@/pages/Transfers";
import Economy from "@/pages/Economy";
import Leagues from "@/pages/Leagues";
import Contracts from "@/pages/Contracts";
import Leaderboard from "@/pages/Leaderboard";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clubs" component={Clubs} />
      <Route path="/clubs/:id" component={ClubDetail} />
      <Route path="/my-club" component={MyClub} />
      <Route path="/players" component={Players} />
      <Route path="/transfers" component={Transfers} />
      <Route path="/economy" component={Economy} />
      <Route path="/leagues" component={Leagues} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
