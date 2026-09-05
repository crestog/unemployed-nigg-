import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  HelpCircle,
  Loader2,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import { roadmapCatalog } from "@/data/roadmapCatalog";
import { fetchRoadmapTopics, isAbort } from "@/lib/roadmapData";
import {
  AtlasAiError,
  generateAiPlan,
  syncAtlasAction,
  type AiPlan,
} from "@/lib/atlasState";

type Topic = {
  id: string;
  roadmapSlug: string;
  title: string;
  summary: string;
  slug: string;
};
const PLAN_KEY = "atlas-learning-plan";

function searchRoadmap(goal: string, level: string) {
  const normalized = goal.toLowerCase();
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2);
  const ranked = roadmapCatalog
    .map(roadmap => {
      const haystack =
        `${roadmap.title} ${roadmap.slug.replaceAll("-", " ")} ${roadmap.description}`.toLowerCase();
      const overlap = tokens.reduce(
        (score, token) => score + (haystack.includes(token) ? 1 : 0),
        0
      );
      const direct =
        normalized.includes(roadmap.title.toLowerCase()) ||
        normalized.includes(roadmap.slug.replaceAll("-", " "))
          ? 8
          : 0;
      return { roadmap, score: overlap + direct };
    })
    .sort((a, b) => b.score - a.score);
  if (ranked[0]?.score > 0) return ranked[0].roadmap;
  if (level === "career")
    return (
      roadmapCatalog.find(roadmap => roadmap.category === "role") ||
      roadmapCatalog[0]
    );
  return (
    roadmapCatalog.find(roadmap => roadmap.category === "skill") ||
    roadmapCatalog[0]
  );
}

export default function RoadmapPlan() {
  const [topicData, setTopicData] = useState<Topic[]>([]);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [hours, setHours] = useState("5");
  const [pace, setPace] = useState("steady");
  const [generated, setGenerated] = useState<AiPlan | null>(null);
  const [clarifications, setClarifications] = useState<Record<number, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedRoadmap = useMemo(
    () => searchRoadmap(goal, level),
    [goal, level]
  );
  const topicsById = useMemo(
    () => new Map(topicData.map(topic => [topic.id, topic])),
    [topicData]
  );

  useEffect(() => {
    // Was a fetch of the whole 19.9 MB roadmap-content.json on mount, filtered
    // to the matched roadmap at generate time. Only the matched roadmap's topics
    // are ever sent to the planner, and the match changes as the goal text
    // changes, so this now follows the selection and cancels the previous load.
    const controller = new AbortController();
    fetchRoadmapTopics(selectedRoadmap.slug, controller.signal)
      .then(setTopicData)
      .catch((thrown: unknown) => {
        if (isAbort(thrown)) return;
        console.error(
          `atlas: could not load topics for ${selectedRoadmap.slug}`,
          thrown
        );
        setTopicData([]);
      });
    return () => controller.abort();
  }, [selectedRoadmap.slug]);

  async function generate() {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setError("");
    const clarificationText = Object.values(clarifications)
      .filter(Boolean)
      .join(" ");
    const result = await generateAiPlan({
      goal: clarificationText
        ? `${goal.trim()} Additional learner context: ${clarificationText}`
        : goal.trim(),
      level,
      hours: Number(hours),
      pace,
      roadmap: {
        slug: selectedRoadmap.slug,
        title: selectedRoadmap.title,
        description: selectedRoadmap.description,
      },
      topics: topicData
        .filter(topic => topic.roadmapSlug === selectedRoadmap.slug)
        .slice(0, 140),
    }).catch((thrown: unknown) => {
      // AtlasAiError carries the reason — a rate limit, or a rejected body.
      setError(
        thrown instanceof AtlasAiError
          ? thrown.message
          : "Atlas could not reach the AI service. Try again, or open the roadmap and continue manually."
      );
      return null;
    });
    setLoading(false);
    if (!result) {
      setError(
        current =>
          current ||
          "Atlas could not reach the AI service. Try again, or open the roadmap and continue manually."
      );
      return;
    }
    setGenerated(result);
    const topicIds = result.phases.flatMap(phase => phase.topicIds);
    const plan = {
      goal,
      level,
      // `hours` is <select> state, so it is a string. `bodyNumber` in worker.ts
      // rejects a non-number rather than coercing it, so posting the raw value
      // was a guaranteed 400 on every plan save.
      hours: Number(hours),
      pace,
      roadmapSlug: result.roadmapSlug || selectedRoadmap.slug,
      topicIds,
      createdAt: new Date().toISOString(),
      mode: result.mode,
    };
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    void syncAtlasAction({ action: "plan", ...plan });
  }

  const planTopics =
    generated?.phases.flatMap(
      phase =>
        phase.topicIds
          .map(topicId => topicsById.get(topicId))
          .filter(Boolean) as Topic[]
    ) || [];

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#f6f4ff]">
      <header className="border-b border-white/10 bg-[#0b1220]/95">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-4 lg:px-8">
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#b9c3da] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Roadmaps
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#8b9ab6] hover:text-white"
          >
            Atlas explorer
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-10 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-[#c4b5fd]">
              Atlas AI Tutor · roadmap-aware
            </p>
            <h1 className="atlas-serif mt-4 max-w-2xl text-5xl font-semibold tracking-[-.06em] text-white sm:text-6xl">
              Build a learning path around your life.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#a9b4cb]">
              Tell Atlas what you want to learn, how much time you have, and how
              deep you want to go. Atlas uses real roadmap nodes, your
              constraints, and a server-side AI coach to create an explainable
              route.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
                <Target className="h-5 w-5 text-[#c084fc]" />
                <p className="mt-4 font-bold text-white">Goal first</p>
                <p className="mt-1 text-xs leading-5 text-[#8492ad]">
                  Start from the outcome you care about.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
                <Clock3 className="h-5 w-5 text-[#c084fc]" />
                <p className="mt-4 font-bold text-white">Fits your pace</p>
                <p className="mt-1 text-xs leading-5 text-[#8492ad]">
                  Choose a realistic weekly commitment.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
                <Sparkles className="h-5 w-5 text-[#c084fc]" />
                <p className="mt-4 font-bold text-white">Explainable</p>
                <p className="mt-1 text-xs leading-5 text-[#8492ad]">
                  Every phase points back to real topic IDs.
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#111a2c] p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#8b5cf6]/15 text-[#d8b4fe]">
                <WandSparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-white">Create an AI plan</p>
                <p className="text-xs text-[#8492ad]">
                  Atlas will explain its assumptions
                </p>
              </div>
            </div>
            <label className="mt-7 block">
              <span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">
                What do you want to learn?
              </span>
              <textarea
                value={goal}
                onChange={event => setGoal(event.target.value)}
                placeholder="e.g. I want to become a backend engineer…"
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none placeholder:text-[#65728c] focus:border-[#8b5cf6]"
              />
            </label>
            <label className="mt-5 block">
              <span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">
                Where are you today?
              </span>
              <select
                value={level}
                onChange={event => setLevel(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none focus:border-[#8b5cf6]"
              >
                <option value="beginner">Starting from the beginning</option>
                <option value="some">I know the basics</option>
                <option value="working">I already work in this area</option>
                <option value="career">I want a role transition</option>
              </select>
            </label>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">
                  Hours per week
                </span>
                <select
                  value={hours}
                  onChange={event => setHours(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none focus:border-[#8b5cf6]"
                >
                  <option value="2">2 hours</option>
                  <option value="5">5 hours</option>
                  <option value="10">10 hours</option>
                  <option value="15">15+ hours</option>
                </select>
              </label>
              <label>
                <span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">
                  Depth
                </span>
                <select
                  value={pace}
                  onChange={event => setPace(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none focus:border-[#8b5cf6]"
                >
                  <option value="fast">Fast start</option>
                  <option value="steady">Steady path</option>
                  <option value="deep">Deep foundation</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => void generate()}
              disabled={!goal.trim() || loading}
              className="atlas-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#c084fc] to-[#8b5cf6] px-4 py-3 text-sm font-bold text-[#160b26] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Atlas is
                  thinking…
                </>
              ) : (
                <>
                  Generate my plan <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            {error && (
              <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs leading-5 text-red-200">
                {error}
              </p>
            )}
          </section>
        </div>
        {generated && (
          <section className="mt-10 rounded-2xl border border-[#8b5cf6]/40 bg-[#8b5cf6]/[.08] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#d8b4fe]">
                  Your AI starting route
                </p>
                <h2 className="atlas-serif mt-2 text-3xl font-semibold tracking-[-.05em] text-white">
                  {selectedRoadmap.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb8ce]">
                  {generated.interpretation}
                </p>
              </div>
              <Link
                href={`/roadmaps/${generated.roadmapSlug || selectedRoadmap.slug}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-[#e4e8f4] hover:border-[#c084fc] hover:text-white"
              >
                Open roadmap <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#0f182a]/70 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8492ad]">
                  Confidence
                </p>
                <p className="mt-2 text-xl font-bold text-white">
                  {Math.round(generated.confidence * 100)}%
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96a3bb]">
                  How well the goal matched the supplied roadmap context.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0f182a]/70 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8492ad]">
                  Weekly rhythm
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d5dced]">
                  {generated.weeklyRhythm}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0f182a]/70 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8492ad]">
                  Plan mode
                </p>
                <p className="mt-2 text-sm font-bold text-[#d8b4fe]">
                  {generated.mode === "ai" ? "AI grounded" : "Offline fallback"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96a3bb]">
                  Atlas never invents topic IDs outside the roadmap data.
                </p>
              </div>
            </div>
            {generated.clarifyingNeeded &&
              generated.followUpQuestions.length > 0 && (
                <div className="mt-5 rounded-xl border border-[#f0abfc]/25 bg-[#f0abfc]/[.06] p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#f5d0fe]">
                    <HelpCircle className="h-4 w-4" /> Atlas can refine this
                    route
                  </p>
                  <div className="mt-3 grid gap-3">
                    {generated.followUpQuestions.map((question, index) => (
                      <label key={question} className="block">
                        <span className="text-xs text-[#d9c6e0]">
                          {question}
                        </span>
                        <input
                          value={clarifications[index] || ""}
                          onChange={event =>
                            setClarifications(current => ({
                              ...current,
                              [index]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1627] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c084fc]"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => void generate()}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#f0abfc]/40 px-3 py-2 text-xs font-bold text-[#f5d0fe] hover:bg-[#f0abfc]/10"
                  >
                    Refine my plan <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            {generated.assumptions.length > 0 && (
              <div className="mt-5 rounded-xl border border-white/10 bg-[#0f182a]/55 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8492ad]">
                  Atlas assumptions
                </p>
                <ul className="mt-2 grid gap-1 text-xs leading-5 text-[#9eabc2]">
                  {generated.assumptions.map(assumption => (
                    <li key={assumption}>• {assumption}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 grid gap-4">
              {generated.phases.map((phase, phaseIndex) => (
                <article
                  key={`${phase.title}-${phaseIndex}`}
                  className="rounded-xl border border-white/10 bg-[#0f182a]/85 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#c084fc]">
                        Phase {phaseIndex + 1} · {phase.hours} hours
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-white">
                        {phase.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#bdc7da]">
                        {phase.outcome}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#c084fc]/25 bg-[#c084fc]/10 px-2.5 py-1 text-[10px] font-bold text-[#d8b4fe]">
                      <Check className="h-3 w-3" /> Explainable
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-white/[.025] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8492ad]">
                        Why these topics
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#aab6cd]">
                        {phase.why}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[.025] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8492ad]">
                        Practice project
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#aab6cd]">
                        {phase.project}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[.025] p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8492ad]">
                        Checkpoint
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#aab6cd]">
                        {phase.checkpoint}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {phase.topicIds.map(topicId => (
                      <span
                        key={topicId}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-[10px] font-bold text-[#d4dcec]"
                      >
                        <Check className="h-3 w-3 text-[#c084fc]" />{" "}
                        {topicsById.get(topicId)?.title || "Roadmap topic"}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-[#7f8da8]">
              {planTopics.length} grounded roadmap topics selected. The AI
              output is a starting hypothesis; use the roadmap chat to adapt it
              as you learn.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
