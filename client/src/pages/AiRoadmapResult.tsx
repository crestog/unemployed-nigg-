import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import CustomRoadmapGraph, {
  type GeneratedRoadmap,
} from "@/components/CustomRoadmapGraph";
import AtlasTutorChat from "@/components/AtlasTutorChat";
import { readJson } from "@/lib/localJson";

const PROGRESS_KEY = "atlas-generated-roadmap-progress";
const NOTES_KEY = "atlas-generated-roadmap-notes";

function isGeneratedRoadmap(value: unknown): value is GeneratedRoadmap {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GeneratedRoadmap>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    Array.isArray(candidate.nodes) &&
    candidate.nodes.length >= 6 &&
    candidate.nodes.every(
      node =>
        node &&
        typeof node.id === "string" &&
        typeof node.title === "string" &&
        typeof node.phase === "string"
    ) &&
    Array.isArray(candidate.edges)
  );
}

export default function AiRoadmapResult() {
  const [, navigate] = useLocation();
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>(() =>
    readJson(PROGRESS_KEY, [])
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    readJson(NOTES_KEY, {})
  );
  const [showTutor, setShowTutor] = useState(false);

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(
        sessionStorage.getItem("atlas-generated-roadmap") || "null"
      );
      if (isGeneratedRoadmap(parsed)) {
        setRoadmap(parsed);
      } else {
        setLoadError(
          "Atlas received an empty or incomplete roadmap response. Nothing was saved as a valid roadmap."
        );
      }
    } catch {
      setLoadError("The saved roadmap response could not be read.");
    }
  }, []);

  const topics = useMemo(
    () =>
      (roadmap?.nodes || []).map(node => ({
        id: node.id,
        title: node.title,
        summary: node.description,
        slug: node.id,
      })),
    [roadmap]
  );
  const progress = useMemo(
    () =>
      completed.reduce<Record<string, boolean>>((result, id) => {
        result[id] = true;
        return result;
      }, {}),
    [completed]
  );

  if (!roadmap)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f6f8] px-5 text-center text-[#111827]">
        <div className="max-w-md">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d4aff]">
            Roadmap response unavailable
          </p>
          <p className="mt-3 text-base font-bold">
            {loadError || "No generated roadmap found."}
          </p>
          <p className="mt-3 text-sm leading-6 text-[#697386]">
            Try the one-submit generator again. Atlas will only open a result
            when it has a real graph to render.
          </p>
          <button
            type="button"
            onClick={() => navigate("/ai/roadmap")}
            className="mt-4 rounded-lg bg-black px-4 py-3 text-sm font-bold text-white"
          >
            Create a roadmap
          </button>
        </div>
      </div>
    );

  function toggleComplete(nodeId: string, isComplete?: boolean) {
    const nextComplete = isComplete ?? !completed.includes(nodeId);
    const next = nextComplete
      ? Array.from(new Set([...completed, nodeId]))
      : completed.filter(id => id !== nodeId);
    setCompleted(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  }

  function saveNote(topicId: string, note: string) {
    const next = { ...notes, [topicId]: note };
    setNotes(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#111827]">
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/ai/roadmap")}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#252c38] hover:text-[#6d4aff]"
          >
            <ArrowLeft className="h-4 w-4" /> Create another
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTutor(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#dfe3e9] bg-white px-3 py-2 text-xs font-bold text-[#252c38] hover:border-[#6d4aff] hover:text-[#5b3fe0]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Ask Atlas
            </button>
            <button
              type="button"
              onClick={() => {
                setCompleted([]);
                localStorage.removeItem(PROGRESS_KEY);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#dfe3e9] text-[#697386] hover:border-[#6d4aff] hover:text-[#5b3fe0]"
              aria-label="Reset progress"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1220px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#6d4aff]">
              <Sparkles className="h-3.5 w-3.5" /> Atlas AI generated roadmap
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] text-[#111827] sm:text-5xl">
              {roadmap.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#5b6472]">
              {roadmap.description}
            </p>
            <p className="mt-2 text-sm text-[#7b8492]">{roadmap.learnerFit}</p>
          </div>
          <div className="rounded-xl border border-[#e2e5ea] bg-white px-4 py-3 text-sm text-[#5b6472]">
            <span className="font-bold text-[#111827]">{completed.length}</span>{" "}
            of{" "}
            <span className="font-bold text-[#111827]">
              {roadmap.nodes.length}
            </span>{" "}
            topics done
          </div>
        </div>
        {roadmap.assumptions && roadmap.assumptions.length > 0 && (
          <div className="mb-6 rounded-xl border border-[#f1df9b] bg-[#fffbea] px-4 py-3 text-sm leading-6 text-[#6b5a17]">
            <span className="font-bold">Atlas assumptions:</span>{" "}
            {roadmap.assumptions.join(" ")}
          </div>
        )}
        <CustomRoadmapGraph
          roadmap={roadmap}
          completedIds={completed}
          onToggleComplete={toggleComplete}
        />
        <div className="mt-6 rounded-xl border border-[#dfe3e9] bg-white p-5">
          <p className="text-sm font-bold text-[#111827]">
            Keep going with context
          </p>
          <p className="mt-1 text-sm leading-6 text-[#697386]">
            Ask Atlas to explain a node, recommend what to learn next, or help
            you turn the map into a practice session.
          </p>
          <button
            type="button"
            onClick={() => setShowTutor(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#111827] px-4 py-3 text-sm font-bold text-white hover:bg-[#2a3443]"
          >
            <MessageCircle className="h-4 w-4" /> Open roadmap tutor
          </button>
        </div>
      </main>
      {showTutor && (
        <AtlasTutorChat
          roadmap={{
            slug: `generated-${roadmap.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            title: roadmap.title,
            description: roadmap.description,
          }}
          topics={topics}
          progress={progress}
          notes={notes}
          onToggleProgress={toggleComplete}
          onSaveNote={saveNote}
          onClose={() => setShowTutor(false)}
        />
      )}
    </div>
  );
}
