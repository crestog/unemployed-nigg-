// Industry Niche Atlas style reminder: editorial cartography, warm mineral paper, ink typography, oxidized teal paths, coral signals, evidence beside interpretation.
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/RealHome"));
const Roadmaps = lazy(() => import("./pages/Roadmaps"));
const RoadmapDetail = lazy(() => import("./pages/RoadmapDetail"));
const RoadmapPlan = lazy(() => import("./pages/RoadmapPlan"));
const AiRoadmapGenerator = lazy(() => import("./pages/AiRoadmapGenerator"));
const AiRoadmapResult = lazy(() => import("./pages/AiRoadmapResult"));
// Mounted on every route but only visible once a comparison is started, so it
// was pure weight on first paint. Lazy here means it downloads when opened.
const RoleComparisonOverlay = lazy(
  () => import("./components/RoleComparisonOverlay")
);

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
        {/* `/roadmaps/plan` used to render AiRoadmapGenerator, which generates a
            brand-new roadmap graph from a topic — a different feature from the
            goal-driven study planner in RoadmapPlan, which was complete but had
            no route at all. Both are now reachable, each at its own path. This
            route must precede `/roadmaps/:slug` or the slug pattern swallows it. */}
        <Route path={"/roadmaps/plan"} component={RoadmapPlan} />
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
          {/* Its own boundary: the overlay must not hold up the page it floats
              over, and its trigger appearing a beat late is invisible. */}
          <Suspense fallback={null}>
            <RoleComparisonOverlay />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
