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

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: gameState, isLoading } = useGetGameState();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && gameState && !gameState.started) {
      setLocation("/");
    }
  }, [gameState, isLoading, setLocation]);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!gameState?.started) return null;

  return <Component />;
}

function MainRouter() {
  const { data: gameState, isLoading } = useGetGameState();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && gameState?.started && window.location.pathname === "/") {
      setLocation("/dashboard");
    }
  }, [gameState, isLoading, setLocation]);

  return (
    <Switch>
      <Route path="/" component={ClubSelection} />
      
      <Route path="/dashboard">
        <Layout><ProtectedRoute component={Dashboard} /></Layout>
      </Route>
      <Route path="/squad">
        <Layout><ProtectedRoute component={Squad} /></Layout>
      </Route>
      <Route path="/tactics">
        <Layout><ProtectedRoute component={Tactics} /></Layout>
      </Route>
      <Route path="/fixtures">
        <Layout><ProtectedRoute component={Fixtures} /></Layout>
      </Route>
      <Route path="/league">
        <Layout><ProtectedRoute component={League} /></Layout>
      </Route>
      <Route path="/transfers">
        <Layout><ProtectedRoute component={Transfers} /></Layout>
      </Route>
      <Route path="/inbox">
        <Layout><ProtectedRoute component={Inbox} /></Layout>
      </Route>
      <Route path="/finances">
        <Layout><ProtectedRoute component={Finances} /></Layout>
      </Route>

      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <MainRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
