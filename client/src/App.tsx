// Industry Niche Atlas style reminder: editorial cartography, warm mineral paper, ink typography, oxidized teal paths, coral signals, evidence beside interpretation.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/RealHome";
import RoleComparisonOverlay from "./components/RoleComparisonOverlay";
import Roadmaps from "./pages/Roadmaps";
import RoadmapDetail from "./pages/RoadmapDetail";
import AiRoadmapGenerator from "./pages/AiRoadmapGenerator";
import AiRoadmapResult from "./pages/AiRoadmapResult";

function Router() {
  return (
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
