// Industry Niche Atlas style reminder: editorial cartography, warm mineral paper, ink typography, oxidized teal paths, coral signals, evidence beside interpretation.
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import RoleComparisonOverlay from "./components/RoleComparisonOverlay";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/RealHome"));
const Roadmaps = lazy(() => import("./pages/Roadmaps"));
const RoadmapDetail = lazy(() => import("./pages/RoadmapDetail"));
const AiRoadmapGenerator = lazy(() => import("./pages/AiRoadmapGenerator"));
const AiRoadmapResult = lazy(() => import("./pages/AiRoadmapResult"));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f8f5ec]">
          <div className="animate-pulse font-display text-3xl text-[#0f766e]">
            Loading Atlas…
          </div>
        </div>
      }
    >
      <Switch>
      <Route path={"/ai/roadmap/result"} component={AiRoadmapResult} />
      <Route path={"/ai/roadmap"} component={AiRoadmapGenerator} />
      <Route path={"/roadmaps/plan"} component={AiRoadmapGenerator} />
      <Route path={"/roadmaps/:slug"} component={RoadmapDetail} />
      <Route path={"/roadmaps"} component={Roadmaps} />
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <RoleComparisonOverlay />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
