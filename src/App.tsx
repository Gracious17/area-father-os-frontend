import { useEffect, useRef, lazy, Suspense } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser, getToken } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { apiUrl } from "@/lib/api-client";

// Lazy-loaded pages — each becomes its own JS chunk
const Home                = lazy(() => import("@/pages/home"));
const Dashboard           = lazy(() => import("@/pages/dashboard"));
const UpgradePage         = lazy(() => import("@/pages/upgrade"));
const NotFound            = lazy(() => import("@/pages/not-found"));
const SchedulingPage      = lazy(() => import("@/pages/scheduling"));
const MonetizationPage    = lazy(() => import("@/pages/monetization"));
const AnalyticsPage       = lazy(() => import("@/pages/analytics"));
const AmbassadorsPage     = lazy(() => import("@/pages/ambassadors").then(m => ({ default: m.AmbassadorsPage })));
const BookPromoPage       = lazy(() => import("@/pages/book-promo").then(m => ({ default: m.BookPromoPage })));
const LiveVideoPage       = lazy(() => import("@/pages/live-video").then(m => ({ default: m.LiveVideoPage })));
const LiveSessionSignupPage = lazy(() => import("@/pages/live-session-signup").then(m => ({ default: m.LiveSessionSignupPage })));
const ClipEnginePage      = lazy(() => import("@/pages/clip-engine").then(m => ({ default: m.ClipEnginePage })));
const AutoPostPage        = lazy(() => import("@/pages/auto-post").then(m => ({ default: m.AutoPostPage })));
const TrafficPage         = lazy(() => import("@/pages/traffic").then(m => ({ default: m.TrafficPage })));
const FanHubPage          = lazy(() => import("@/pages/fan-hub").then(m => ({ default: m.FanHubPage })));
const IntelligencePage    = lazy(() => import("@/pages/intelligence").then(m => ({ default: m.IntelligencePage })));
const MediaPartnersPage   = lazy(() => import("@/pages/media-partners").then(m => ({ default: m.MediaPartnersPage })));
const InviteLandingPage   = lazy(() => import("@/pages/invite-landing").then(m => ({ default: m.InviteLandingPage })));
const AmbassadorPortalPage = lazy(() => import("@/pages/ambassador-portal").then(m => ({ default: m.AmbassadorPortalPage })));
const AdminPage           = lazy(() => import("@/pages/admin").then(m => ({ default: m.AdminPage })));
const SettingsPage        = lazy(() => import("@/pages/settings").then(m => ({ default: m.SettingsPage })));
const SupportPage         = lazy(() => import("@/pages/support").then(m => ({ default: m.SupportPage })));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.startsWith("192.168.") ||
  window.location.hostname.startsWith("10.") ||
  window.location.hostname.startsWith("172.");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Proxy mode is a Clerk feature for routing Clerk's frontend-API traffic
// through this app's own domain instead of talking to Clerk directly — it
// requires a server-side route on THIS domain to actually proxy the request,
// which this frontend does not have. With a real custom Clerk domain already
// configured (clerk.areafadaos.com), this should stay unset. `|| undefined`
// guards against an empty-string env var still being treated as "set" by
// ClerkProvider. If you ever see Clerk requests 404 at /__clerk/*, check
// VITE_CLERK_PROXY_URL in Vercel's env vars — it's very likely still set
// there from a previous configuration and should be removed.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  layout: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    applicationName: "AreaFada OS",
  },
  variables: {
    colorPrimary: "#2dd172",
    colorForeground: "#0d0d0d",
    colorMutedForeground: "#666666",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#f0f0f0",
    colorInputForeground: "#0d0d0d",
    colorNeutral: "#d1d5db",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold text-2xl",
    headerSubtitle: "text-gray-500 text-sm",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium text-sm",
    footerActionLink: "text-emerald-600 font-semibold hover:text-emerald-700",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400 text-sm",
    identityPreviewEditButton: "text-emerald-600",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-gray-800",
    logoBox: "mb-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 text-gray-700",
    formButtonPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white font-semibold",
    formFieldInput: "border border-gray-200 bg-gray-50 text-gray-900 focus:ring-emerald-500",
    footerAction: "bg-gray-50 border-t border-gray-100",
    dividerLine: "bg-gray-200",
    alert: "border border-red-100 bg-red-50",
    otpCodeFieldInput: "border border-gray-200 bg-gray-50",
    formFieldRow: "mb-4",
    main: "p-6",
  },
};




function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
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
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function useConsumeInviteToken() {
  const { user } = useUser();
  useEffect(() => {
    if (!user) return;
    const inviteToken = localStorage.getItem("partnerInviteToken");
    if (!inviteToken) return;
    (async () => {
      try {
        const authToken = await getToken();
        const res = await fetch(apiUrl("/api/partner-invites/complete-signup"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ token: inviteToken }),
        });
        // Clear on success AND on a definitive rejection (bad/expired/already-used
        // token) so this doesn't retry forever on every future sign-in — only
        // leave it in place for transient failures (network/5xx) to retry later.
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          localStorage.removeItem("partnerInviteToken");
          localStorage.removeItem("partnerInviteTier");
        }
        if (!res.ok) {
          console.error("Failed to complete partner invite signup:", await res.text().catch(() => res.statusText));
        }
      } catch (err) {
        // Network error — leave the token in place to retry on next sign-in.
        console.error("Failed to complete partner invite signup:", err);
      }
    })();
  }, [user?.id]);
}

function AuthRequired({ children }: { children: React.ReactNode }) {
  useConsumeInviteToken();
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back, Fada",
            subtitle: "Sign in to your creator OS",
          },
        },
        signUp: {
          start: {
            title: "Join Area Fada OS",
            subtitle: "Your social media monetization engine",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />

              <Route path="/dashboard">
                <AuthRequired><Dashboard /></AuthRequired>
              </Route>
              <Route path="/upgrade">
                <AuthRequired><UpgradePage /></AuthRequired>
              </Route>
              <Route path="/scheduling">
                <AuthRequired><SchedulingPage /></AuthRequired>
              </Route>
              <Route path="/monetization">
                <AuthRequired><MonetizationPage /></AuthRequired>
              </Route>
              <Route path="/analytics">
                <AuthRequired><AnalyticsPage /></AuthRequired>
              </Route>
              <Route path="/book-promo">
                <AuthRequired><BookPromoPage /></AuthRequired>
              </Route>
              <Route path="/live-video">
                <AuthRequired><LiveVideoPage /></AuthRequired>
              </Route>
              <Route path="/live/:id">
                {(params: { id?: string }) => <LiveSessionSignupPage sessionId={Number(params.id)} />}
              </Route>
              <Route path="/clip-engine">
                <AuthRequired><ClipEnginePage /></AuthRequired>
              </Route>
              <Route path="/auto-post">
                <AuthRequired><AutoPostPage /></AuthRequired>
              </Route>
              <Route path="/traffic">
                <AuthRequired><TrafficPage /></AuthRequired>
              </Route>
              <Route path="/ambassadors">
                <AuthRequired><AmbassadorsPage /></AuthRequired>
              </Route>
              <Route path="/fan-hub">
                <AuthRequired><FanHubPage /></AuthRequired>
              </Route>
              <Route path="/intelligence">
                <AuthRequired><IntelligencePage /></AuthRequired>
              </Route>
              <Route path="/media-partners">
                <AuthRequired><MediaPartnersPage /></AuthRequired>
              </Route>
              <Route path="/invite/:token" component={InviteLandingPage} />
              <Route path="/ambassador-portal" component={AmbassadorPortalPage} />

              <Route path="/support">
                <AuthRequired><SupportPage /></AuthRequired>
              </Route>
              <Route path="/admin">
                <AuthRequired><AdminPage /></AuthRequired>
              </Route>
              <Route path="/settings">
                <AuthRequired><SettingsPage /></AuthRequired>
              </Route>

              <Route component={NotFound} />
            </Switch>
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
