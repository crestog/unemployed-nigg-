import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Heart,
  ListFilter,
  Search,
  Sparkles,
  MessageCircle,
  X,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { roadmapCatalog, type RoadmapTopic } from "@/data/roadmapCatalog";
import RoadmapGraph from "@/components/RoadmapGraph";
import AtlasTutorChat from "@/components/AtlasTutorChat";
import { loadAtlasSnapshot, syncAtlasAction } from "@/lib/atlasState";
const PROGRESS_KEY = "atlas-roadmap-progress";
const FAVORITES_KEY = "atlas-roadmap-favorites";
const NOTES_KEY = "atlas-roadmap-notes";
type TopicRecord = RoadmapTopic & {
  roadmapSlug: string;
  markdown: string;
  links: { label: string; url: string }[];
  sourceUrl: string;
};
function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function titleCase(value: string) {
  return value
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function RoadmapDetail() {
  const [, params] = useRoute<{ slug: string }>("/roadmaps/:slug");
  const slug = params?.slug || "frontend";
  const roadmap =
    roadmapCatalog.find(item => item.slug === slug) || roadmapCatalog[0];
  const [topicData, setTopicData] = useState<TopicRecord[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const roadmapTopics = useMemo(
    () => topicData.filter(topic => topic.roadmapSlug === roadmap.slug),
    [topicData, roadmap.slug]
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TopicRecord | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>(() =>
    readJson(PROGRESS_KEY, {})
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    readJson(FAVORITES_KEY, [])
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    readJson(NOTES_KEY, {})
  );
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [view, setView] = useState<"map" | "topics">("map");
  const [showTutor, setShowTutor] = useState(false);

  useEffect(() => {
    fetch("/data/roadmap-content.json")
      .then(response => response.json() as Promise<TopicRecord[]>)
      .then(setTopicData)
      .catch(() => setTopicData([]))
      .finally(() => setContentLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      roadmapTopics.filter(topic => {
        const text =
          `${topic.title} ${topic.summary} ${topic.slug}`.toLowerCase();
        const matchesQuery =
          !query.trim() || text.includes(query.trim().toLowerCase());
        const done = Boolean(progress[topic.id]);
        const matchesFilter =
          filter === "all" || (filter === "done" ? done : !done);
        return matchesQuery && matchesFilter;
      }),
    [roadmapTopics, query, filter, progress]
  );

  const completed = roadmapTopics.filter(topic => progress[topic.id]).length;
  const percentage = roadmapTopics.length
    ? Math.round((completed / roadmapTopics.length) * 100)
    : 0;

  useEffect(() => {
    setSelected(null);
    setQuery("");
    setFilter("all");
  }, [roadmap.slug]);

  useEffect(() => {
    void loadAtlasSnapshot().then(snapshot => {
      if (!snapshot) return;
      setFavorites(current =>
        Array.from(new Set([...current, ...snapshot.favorites]))
      );
      setProgress(current => ({ ...current, ...snapshot.progress }));
      setNotes(current => ({ ...current, ...snapshot.notes }));
    });
  }, []);

  function saveNote(topicId: string, note: string) {
    const next = { ...notes, [topicId]: note };
    setNotes(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
    void syncAtlasAction({
      action: "note",
      roadmapSlug: roadmap.slug,
      topicId,
      note,
    });
  }

  function toggleProgress(id: string, forced?: boolean) {
    const next = { ...progress, [id]: forced ?? !progress[id] };
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    void syncAtlasAction({
      action: "progress",
      roadmapSlug: roadmap.slug,
      topicId: id,
      completed: Boolean(next[id]),
    });
  }

  function toggleFavorite() {
    const next = favorites.includes(roadmap.slug)
      ? favorites.filter(item => item !== roadmap.slug)
      : [...favorites, roadmap.slug];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    void syncAtlasAction({
      action: "favorite",
      roadmapSlug: roadmap.slug,
      saved: next.includes(roadmap.slug),
    });
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#f6f4ff]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#b9c3da] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All roadmaps
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => setShowTutor(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b5cf6]/50 bg-[#8b5cf6]/10 px-3 py-2 text-xs font-bold text-[#d8b4fe] hover:bg-[#8b5cf6]/20"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Ask Atlas
            </button>
            <Link
              href="/roadmaps/plan"
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b5cf6]/50 bg-[#8b5cf6]/10 px-3 py-2 text-xs font-bold text-[#d8b4fe] hover:bg-[#8b5cf6]/20"
            >
              <Sparkles className="h-3.5 w-3.5" /> Create a plan
            </Link>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-xs font-bold text-[#b9c3da] hover:bg-white/[.06] hover:text-white"
            >
              Atlas explorer
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8 lg:py-12">
        <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#9a8bff]">
              <span>
                {roadmap.category === "role"
                  ? "Role-based roadmap"
                  : "Skill-based roadmap"}
              </span>
              <span className="text-[#53617d]">/</span>
              <span>{roadmap.slug}</span>
            </div>
            <h1 className="atlas-serif mt-4 text-5xl font-semibold tracking-[-.06em] text-white sm:text-6xl">
              {roadmap.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#a9b4cb]">
              {roadmap.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={toggleFavorite}
                className={`atlas-button inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold ${favorites.includes(roadmap.slug) ? "border-[#f0abfc]/70 bg-[#f0abfc]/15 text-[#f0abfc]" : "border-white/15 text-[#d8def0] hover:border-[#f0abfc]/60 hover:text-[#f0abfc]"}`}
              >
                <Heart
                  className={`h-4 w-4 ${favorites.includes(roadmap.slug) ? "fill-current" : ""}`}
                />{" "}
                {favorites.includes(roadmap.slug) ? "Saved" : "Save roadmap"}
              </button>
              <a
                href={roadmap.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-[#d8def0] hover:border-[#9a8bff] hover:text-white"
              >
                Public source <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111a2c] p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8492ad]">
                  Your progress
                </p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {percentage}%
                </p>
              </div>
              <p className="text-sm text-[#8e9bb7]">
                {completed} / {roadmapTopics.length.toLocaleString()} topics
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c084fc] to-[#8b5cf6] transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-[#8492ad]">
              Progress is saved locally for this private prototype and can later
              move to an Atlas account.
            </p>
          </div>
        </section>

        <div className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#c4b5fd]">
                Explore the roadmap
              </p>
              <p className="mt-1 text-sm text-[#8492ad]">
                Switch between the public graph layout and the full topic index.
              </p>
            </div>
            <div className="flex rounded-lg border border-white/10 bg-[#111a2c] p-1">
              <button
                type="button"
                onClick={() => setView("map")}
                className={`rounded-md px-3 py-2 text-xs font-bold ${view === "map" ? "bg-[#8b5cf6]/20 text-[#d8b4fe]" : "text-[#8190ac] hover:text-white"}`}
              >
                Map view
              </button>
              <button
                type="button"
                onClick={() => setView("topics")}
                className={`rounded-md px-3 py-2 text-xs font-bold ${view === "topics" ? "bg-[#8b5cf6]/20 text-[#d8b4fe]" : "text-[#8190ac] hover:text-white"}`}
              >
                Topic list
              </button>
            </div>
          </div>
          {view === "map" ? (
            <RoadmapGraph
              slug={roadmap.slug}
              topics={roadmapTopics}
              progress={progress}
              onTopicSelect={topic => {
                const fullTopic = topicData.find(item => item.id === topic.id);
                if (fullTopic) setSelected(fullTopic);
              }}
            />
          ) : (
            <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="lg:sticky lg:top-[80px] lg:h-fit">
                <div className="rounded-xl border border-white/10 bg-[#111a2c] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#9a8bff]">
                    Roadmap map
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#9ba8c1]">
                    Browse every public topic captured for this path. Start
                    anywhere, then use Atlas to shape the order around your
                    goal.
                  </p>
                  <div className="mt-5 grid gap-2">
                    <div className="flex items-center justify-between rounded-lg bg-white/[.04] px-3 py-2 text-xs">
                      <span className="text-[#8896b2]">Topics</span>
                      <strong className="text-white">
                        {roadmapTopics.length.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[.04] px-3 py-2 text-xs">
                      <span className="text-[#8896b2]">Completed</span>
                      <strong className="text-[#d8b4fe]">{completed}</strong>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[.04] px-3 py-2 text-xs">
                      <span className="text-[#8896b2]">Favorites</span>
                      <strong className="text-[#f0abfc]">
                        {favorites.includes(roadmap.slug) ? 1 : 0}
                      </strong>
                    </div>
                  </div>
                  <Link
                    href="/roadmaps/plan"
                    className="mt-5 flex items-center justify-between rounded-lg border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 px-3 py-3 text-sm font-bold text-[#d8b4fe] hover:bg-[#8b5cf6]/20"
                  >
                    Plan my route <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
              <section className="min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#111a2c] px-4 py-3 focus-within:border-[#8b5cf6]">
                    <Search className="h-4 w-4 text-[#c084fc]" />
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      placeholder={`Search ${roadmap.title} topics…`}
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#74819d]"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111a2c] px-3 py-3 text-sm text-[#bcc6da]">
                    <ListFilter className="h-4 w-4 text-[#c084fc]" />
                    <select
                      value={filter}
                      onChange={event =>
                        setFilter(event.target.value as typeof filter)
                      }
                      className="bg-transparent outline-none"
                    >
                      <option value="all" className="bg-[#111a2c]">
                        All topics
                      </option>
                      <option value="open" className="bg-[#111a2c]">
                        Open topics
                      </option>
                      <option value="done" className="bg-[#111a2c]">
                        Completed topics
                      </option>
                    </select>
                  </label>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[#7e8ca8]">
                  <span>
                    {contentLoading
                      ? "Loading public topic data…"
                      : `${filtered.length.toLocaleString()} topics shown`}
                  </span>
                  <span>Click a topic to read its resources</span>
                </div>
                <div className="mt-3 grid gap-2">
                  {filtered.map((topic, index) => {
                    const done = Boolean(progress[topic.id]);
                    return (
                      <article
                        key={topic.id}
                        className={`group flex items-start gap-3 rounded-xl border p-4 transition ${done ? "border-[#8b5cf6]/30 bg-[#8b5cf6]/[.08]" : "border-white/10 bg-[#111a2c] hover:border-[#8b5cf6]/55 hover:bg-[#151f35]"}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleProgress(topic.id)}
                          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${done ? "border-[#c084fc] bg-[#c084fc] text-[#160b26]" : "border-white/20 text-transparent hover:border-[#c084fc]"}`}
                          aria-label={
                            done
                              ? `Mark ${topic.title} as open`
                              : `Mark ${topic.title} as complete`
                          }
                        >
                          {done ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelected(topic)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#687691]">
                                {String(index + 1).padStart(2, "0")} ·{" "}
                                {titleCase(topic.slug)}
                              </p>
                              <h3
                                className={`mt-1 text-base font-semibold ${done ? "text-[#d8b4fe]" : "text-white group-hover:text-[#d8b4fe]"}`}
                              >
                                {topic.title}
                              </h3>
                            </div>
                            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#596781] transition group-hover:text-[#c084fc]" />
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#95a3bd]">
                            {topic.summary}
                          </p>
                        </button>
                      </article>
                    );
                  })}
                </div>
                {!filtered.length && (
                  <div className="mt-8 rounded-xl border border-dashed border-white/15 p-12 text-center">
                    <Search className="mx-auto h-8 w-8 text-[#687691]" />
                    <p className="mt-4 font-bold text-white">
                      No topics match that filter.
                    </p>
                    <p className="mt-2 text-sm text-[#8492ad]">
                      Try a broader search or return to all topics.
                    </p>
                  </div>
                )}
              </section>
            </section>
          )}
        </div>
      </main>

      {showTutor && (
        <AtlasTutorChat
          roadmap={{
            slug: roadmap.slug,
            title: roadmap.title,
            description: roadmap.description,
          }}
          topics={roadmapTopics}
          progress={progress}
          notes={notes}
          onToggleProgress={toggleProgress}
          onSaveNote={saveNote}
          onClose={() => setShowTutor(false)}
        />
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.title} topic`}
        >
          <aside className="h-full w-full max-w-[720px] overflow-y-auto border-l border-white/10 bg-[#0f182a] p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#c084fc]">
                  {roadmap.title} topic
                </p>
                <h2 className="atlas-serif mt-3 text-3xl font-semibold tracking-[-.05em] text-white">
                  {selected.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#9daac2]">
                  {selected.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-[#bac4d8] hover:border-[#c084fc] hover:text-white"
                aria-label="Close topic"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleProgress(selected.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold ${progress[selected.id] ? "bg-[#c084fc] text-[#160b26]" : "border border-[#8b5cf6]/60 bg-[#8b5cf6]/15 text-[#d8b4fe] hover:bg-[#8b5cf6]/25"}`}
              >
                {progress[selected.id] ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}{" "}
                {progress[selected.id] ? "Completed" : "Mark complete"}
              </button>
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-[#d6ddec] hover:border-[#c084fc] hover:text-white"
              >
                Open source <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <article className="prose prose-invert mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-[#b3bed2] prose-p:leading-7 prose-li:text-[#b3bed2] prose-a:text-[#c4b5fd] prose-strong:text-white">
              <Streamdown>{selected.markdown}</Streamdown>
            </article>
            <section className="mt-8 border-t border-white/10 pt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#8492ad]">
                Your note
              </p>
              <textarea
                value={notes[selected.id] || ""}
                onChange={event => saveNote(selected.id, event.target.value)}
                placeholder="Capture what you understood, a question, or a next action…"
                rows={4}
                className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/[.035] px-3 py-3 text-sm leading-6 text-[#d2dbea] outline-none placeholder:text-[#687691] focus:border-[#c084fc]"
              />
            </section>
            {selected.links.length > 0 && (
              <section className="mt-8 border-t border-white/10 pt-6">
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#8492ad]">
                  Resources in this topic
                </p>
                <div className="mt-3 grid gap-2">
                  {selected.links.map(link => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[.035] px-3 py-3 text-sm text-[#d2dbea] hover:border-[#c084fc]/60 hover:text-white"
                    >
                      <span className="line-clamp-2">{link.label}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-[#c084fc]" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
