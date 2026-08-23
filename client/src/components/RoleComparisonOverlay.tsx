/**
 * Editorial Cartography reminder: the comparison drawer is an advanced, on-demand evidence tool.
 * Warm paper, coral method cues, and visible source limits preserve the atlas’s progressive-disclosure approach.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeftRight, X } from "lucide-react";
import RoleComparison, { type ComparableOccupation } from "./RoleComparison";

export default function RoleComparisonOverlay() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [worldMode, setWorldMode] = useState(
    () =>
      new URLSearchParams(window.location.hash.replace(/^#/, "")).get(
        "world"
      ) === "1"
  );
  const [occupations, setOccupations] = useState<ComparableOccupation[]>([]);
  const [primaryId, setPrimaryId] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open || occupations.length) return;
    fetch("/data/occupations.json")
      .then(response =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("release unavailable"))
      )
      .then((records: ComparableOccupation[]) => {
        setOccupations(records);
        setPrimaryId(records[0]?.id ?? "");
      })
      .catch(() =>
        setError(
          "The official occupation release could not be loaded for comparison."
        )
      );
  }, [open, occupations.length]);
  useEffect(() => {
    const syncWorldMode = () =>
      setWorldMode(
        new URLSearchParams(window.location.hash.replace(/^#/, "")).get(
          "world"
        ) === "1"
      );
    window.addEventListener("hashchange", syncWorldMode);
    return () => window.removeEventListener("hashchange", syncWorldMode);
  }, []);
  useEffect(() => {
    if (worldMode) setOpen(false);
  }, [worldMode]);
  const primary =
    occupations.find(item => item.id === primaryId) ?? occupations[0];
  const compactRoute =
    location.startsWith("/ai/") || location === "/roadmaps/plan";
  return (
    <>
      {!worldMode && !compactRoute && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] inline-flex min-h-10 items-center gap-2 border border-[#b95c78] bg-[#fffaf8]/96 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#9d483c] shadow-lg backdrop-blur transition hover:bg-[#fff1ef] active:scale-[.98] max-sm:bottom-[max(1rem,env(safe-area-inset-bottom))] max-sm:right-3"
          aria-label="Open evidence-based role comparison"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" /> Compare roles
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[80] bg-[#242822]/35 p-2 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Role comparison"
            className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden border border-[#d8d6cd] bg-[#fffefb] shadow-[0_24px_90px_rgba(36,40,34,.28)]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[#e4e2da] bg-[#f8f5ec] px-3 py-3 sm:px-6">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#9d483c]">
                  Atlas tools / evidence comparison
                </div>
                <p className="mt-1 text-xs text-[#666960]">
                  Exact O*NET evidence only; no transition or personal-fit
                  score.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center border border-[#d8d6cd] bg-white text-[#666960] hover:border-[#b95c78] hover:text-[#9d483c]"
                aria-label="Close role comparison"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
              {error ? (
                <p className="mt-6 border-l-2 border-[#b95c78] bg-[#fff1ef] px-4 py-3 text-sm text-[#9d483c]">
                  {error}
                </p>
              ) : primary ? (
                <RoleComparison
                  occupations={occupations}
                  primary={primary}
                  onChoose={setPrimaryId}
                />
              ) : (
                <div className="grid h-48 place-items-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#0f766e]">
                  Loading official occupation records…
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
