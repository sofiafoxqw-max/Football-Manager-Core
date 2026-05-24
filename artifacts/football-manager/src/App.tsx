import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useGetGameState } from "@workspace/api-client-react";

import ClubSelection from "./pages/ClubSelection";
import Dashboard from "./pages/Dashboard";
import Squad from "./pages/Squad";
import Tactics from "./pages/Tactics";
import Fixtures from "./pages/Fixtures";
import League from "./pages/League";
import Transfers from "./pages/Transfers";
import Inbox from "./pages/Inbox";
import Finances from "./pages/Finances";
import Training from "./pages/Training";
import Scouting from "./pages/Scouting";
import Contracts from "./pages/Contracts";
import Staff from "./pages/Staff";
import SetPieces from "./pages/SetPieces";
import PressConference from "./pages/PressConference";
import MatchDay from "./pages/MatchDay";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } }
});

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: gameState, isLoading } = useGetGameState();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && gameState && !gameState.started) setLocation("/");
  }, [gameState, isLoading, setLocation]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64" style={{ color: "var(--fm-muted)" }}>
      <div className="text-sm">Loading...</div>
    </div>
  );
  if (!gameState?.started) return null;
  return <Component />;
}

function MainRouter() {
  const { data: gameState, isLoading } = useGetGameState();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && gameState?.started && window.location.pathname === `${BASE_PATH}/`) {
      setLocation("/dashboard");
    }
  }, [gameState, isLoading, setLocation]);

  return (
    <Switch>
      <Route path="/" component={ClubSelection} />

      <Route path="/dashboard"><Layout><ProtectedRoute component={Dashboard} /></Layout></Route>
      <Route path="/squad"><Layout><ProtectedRoute component={Squad} /></Layout></Route>
      <Route path="/tactics"><Layout><ProtectedRoute component={Tactics} /></Layout></Route>
      <Route path="/fixtures"><Layout><ProtectedRoute component={Fixtures} /></Layout></Route>
      <Route path="/fixtures/:id/match"><Layout><ProtectedRoute component={MatchDay} /></Layout></Route>
      <Route path="/league"><Layout><ProtectedRoute component={League} /></Layout></Route>
      <Route path="/transfers"><Layout><ProtectedRoute component={Transfers} /></Layout></Route>
      <Route path="/inbox"><Layout><ProtectedRoute component={Inbox} /></Layout></Route>
      <Route path="/finances"><Layout><ProtectedRoute component={Finances} /></Layout></Route>
      <Route path="/training"><Layout><ProtectedRoute component={Training} /></Layout></Route>
      <Route path="/scouting"><Layout><ProtectedRoute component={Scouting} /></Layout></Route>
      <Route path="/contracts"><Layout><ProtectedRoute component={Contracts} /></Layout></Route>
      <Route path="/staff"><Layout><ProtectedRoute component={Staff} /></Layout></Route>
      <Route path="/set-pieces"><Layout><ProtectedRoute component={SetPieces} /></Layout></Route>
      <Route path="/press-conference"><Layout><ProtectedRoute component={PressConference} /></Layout></Route>

      <Route><Layout><NotFound /></Layout></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={BASE_PATH}>
          <MainRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
