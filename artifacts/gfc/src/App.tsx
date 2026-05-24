import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

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

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        baseTheme: shadcn,
        cssLayerName: "clerk",
        options: {
          logoPlacement: "inside" as const,
          logoLinkUrl: basePath || "/",
          logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
        },
        variables: {
          colorPrimary: "#10b981",
          colorForeground: "#f1f5f9",
          colorMutedForeground: "#94a3b8",
          colorDanger: "#ef4444",
          colorBackground: "#0f172a",
          colorInput: "#1e293b",
          colorInputForeground: "#f1f5f9",
          colorNeutral: "#334155",
          fontFamily: "Inter, system-ui, sans-serif",
          borderRadius: "0.5rem",
        },
        elements: {
          rootBox: "w-full flex justify-center",
          cardBox: "bg-slate-900 border border-slate-700 rounded-xl w-[440px] max-w-full overflow-hidden shadow-2xl",
          card: "!shadow-none !border-0 !bg-transparent !rounded-none",
          footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
          headerTitle: "text-slate-50 font-bold",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButtonText: "text-slate-200",
          formFieldLabel: "text-slate-300",
          footerActionLink: "text-emerald-400 hover:text-emerald-300",
          footerActionText: "text-slate-400",
          dividerText: "text-slate-500",
          identityPreviewEditButton: "text-emerald-400",
          formFieldSuccessText: "text-emerald-400",
          alertText: "text-slate-200",
          logoBox: "mb-2",
          logoImage: "h-10 w-auto",
          socialButtonsBlockButton: "border-slate-600 bg-slate-800 hover:bg-slate-700",
          formButtonPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white",
          formFieldInput: "bg-slate-800 border-slate-600 text-slate-100",
          footerAction: "border-t border-slate-700",
          dividerLine: "bg-slate-700",
          alert: "bg-slate-800 border-slate-600",
          otpCodeFieldInput: "bg-slate-800 border-slate-600 text-slate-100",
          formFieldRow: "gap-3",
          main: "gap-4",
        },
      }}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
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
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
