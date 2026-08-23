import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Heart,
  Menu,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  roadmapCatalog,
  type Roadmap,
  type RoadmapCategory,
} from "@/data/roadmapCatalog";
import { loadAtlasSnapshot, syncAtlasAction } from "@/lib/atlasState";

const FAVORITES_KEY = "atlas-roadmap-favorites";

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function RoadmapCard({
  roadmap,
  favorite,
  onFavorite,
}: {
  roadmap: Roadmap;
  favorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#111a2c] transition duration-200 hover:-translate-y-0.5 hover:border-[#8b5cf6]/70 hover:bg-[#151f35]">
      <Link
        href={`/roadmaps/${roadmap.slug}`}
        className="block min-h-0 p-4 pr-14 sm:min-h-[142px] sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.045] text-[#c4b5fd]">
            <BookOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight text-[#f6f4ff] group-hover:text-[#d8b4fe]">
              {roadmap.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#98a6c4]">
              {roadmap.description}
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#6f7d9a]">
              {roadmap.topicCount.toLocaleString()} topics
            </p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={onFavorite}
        className={`atlas-button absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border ${favorite ? "border-[#f0abfc]/70 bg-[#f0abfc]/15 text-[#f0abfc]" : "border-white/10 text-[#8290ae] hover:border-[#f0abfc]/60 hover:text-[#f0abfc]"}`}
        aria-label={
          favorite
            ? `Remove ${roadmap.title} from favorites`
            : `Add ${roadmap.title} to favorites`
        }
        title={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
      </button>
    </article>
  );
}

function Navigation() {
  const [menu, setMenu] = useState<"roadmaps" | "ai" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link
          href="/roadmaps"
          className="flex items-center gap-3"
          onClick={() => setMenu(null)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#c084fc] to-[#7c3aed] text-[#130c22] shadow-lg shadow-purple-900/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-white">
              Atlas
            </span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[.24em] text-[#7d8ba7]">
              Learning paths
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu(menu === "roadmaps" ? null : "roadmaps")}
              className="atlas-button inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-[#c1c9dc] hover:bg-white/[.06] hover:text-white"
            >
              Roadmaps <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {menu === "roadmaps" && (
              <div className="absolute left-0 top-12 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#111a2c] p-2 shadow-2xl shadow-black/40">
                <Link
                  href="/roadmaps"
                  className="block rounded-lg px-3 py-3 hover:bg-white/[.06]"
                  onClick={() => setMenu(null)}
                >
                  <span className="block text-sm font-semibold text-white">
                    Browse roadmaps
                  </span>
                  <span className="mt-1 block text-xs text-[#8996b1]">
                    Explore every Atlas learning path
                  </span>
                </Link>
                <Link
                  href="/roadmaps/plan"
                  className="block rounded-lg px-3 py-3 hover:bg-white/[.06]"
                  onClick={() => setMenu(null)}
                >
                  <span className="block text-sm font-semibold text-white">
                    Create a learning plan
                  </span>
                  <span className="mt-1 block text-xs text-[#8996b1]">
                    Turn a goal into a sequence
                  </span>
                </Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu(menu === "ai" ? null : "ai")}
              className="atlas-button inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-[#c1c9dc] hover:bg-white/[.06] hover:text-white"
            >
              AI Tutor <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {menu === "ai" && (
              <div className="absolute left-0 top-12 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#111a2c] p-2 shadow-2xl shadow-black/40">
                <Link
                  href="/roadmaps/plan"
                  className="block rounded-lg px-3 py-3 hover:bg-white/[.06]"
                  onClick={() => setMenu(null)}
                >
                  <span className="block text-sm font-semibold text-white">
                    Create a roadmap
                  </span>
                  <span className="mt-1 block text-xs text-[#8996b1]">
                    Generate a path from your goal
                  </span>
                </Link>
                <Link
                  href="/roadmaps/quiz"
                  className="block rounded-lg px-3 py-3 hover:bg-white/[.06]"
                  onClick={() => setMenu(null)}
                >
                  <span className="block text-sm font-semibold text-white">
                    Test my skills
                  </span>
                  <span className="mt-1 block text-xs text-[#8996b1]">
                    Start with a lightweight diagnostic
                  </span>
                </Link>
                <Link
                  href="/roadmaps/chat"
                  className="block rounded-lg px-3 py-3 hover:bg-white/[.06]"
                  onClick={() => setMenu(null)}
                >
                  <span className="block text-sm font-semibold text-white">
                    Ask Atlas Tutor
                  </span>
                  <span className="mt-1 block text-xs text-[#8996b1]">
                    Plan your next learning step
                  </span>
                </Link>
              </div>
            )}
          </div>
          <a
            href="#about"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#c1c9dc] hover:bg-white/[.06] hover:text-white"
          >
            How it works
          </a>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#c1c9dc] hover:bg-white/[.06] hover:text-white"
          >
            Atlas explorer
          </Link>
          <button
            type="button"
            className="rounded-lg bg-[#f5f3ff] px-3 py-2 text-sm font-bold text-[#211238] hover:bg-[#d8b4fe]"
          >
            Sign in
          </button>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-[#d8def0] md:hidden"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#10192b] px-4 py-4 md:hidden">
          <div className="grid gap-2">
            <Link
              href="/roadmaps"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-white"
            >
              Browse roadmaps
            </Link>
            <Link
              href="/roadmaps/plan"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-white"
            >
              Create a learning plan
            </Link>
            <Link
              href="/roadmaps/quiz"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-white"
            >
              Test my skills
            </Link>
            <Link
              href="/"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-white"
            >
              Atlas explorer
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Roadmaps() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | RoadmapCategory>("all");
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  useEffect(() => {
    void loadAtlasSnapshot().then(snapshot => {
      if (!snapshot) return;
      setFavorites(current =>
        Array.from(new Set([...current, ...snapshot.favorites]))
      );
    });
  }, []);
  const filtered = useMemo(
    () =>
      roadmapCatalog.filter(roadmap => {
        const matchesQuery =
          !query.trim() ||
          `${roadmap.title} ${roadmap.description} ${roadmap.slug}`
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        const matchesCategory =
          category === "all" || roadmap.category === category;
        return matchesQuery && matchesCategory;
      }),
    [query, category]
  );
  const roles = filtered.filter(roadmap => roadmap.category === "role");
  const skills = filtered.filter(roadmap => roadmap.category === "skill");

  function toggleFavorite(slug: string) {
    const next = favorites.includes(slug)
      ? favorites.filter(item => item !== slug)
      : [...favorites, slug];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    void syncAtlasAction({
      action: "favorite",
      roadmapSlug: slug,
      saved: next.includes(slug),
    });
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#f6f4ff]">
      <Navigation />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,.26),transparent_55%)]">
          <div className="mx-auto max-w-[1000px] px-4 pb-10 pt-12 text-center sm:pb-14 sm:pt-16 lg:px-8 lg:pt-24">
            <p className="text-[11px] font-extrabold uppercase tracking-[.28em] text-[#d8b4fe]">
              A community learning atlas
            </p>
            <h1 className="atlas-serif mt-5 text-4xl font-semibold leading-[.95] tracking-[-.055em] text-white sm:text-6xl">
              Developer Roadmaps
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#a9b4cb]">
              Atlas turns ambitious goals into visible paths. Pick a role, a
              skill, or a destination, then explore the concepts, resources,
              projects, and practice that take you there.
            </p>
            <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <Link
                href="/roadmaps/plan"
                className="atlas-button inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#c084fc] to-[#8b5cf6] px-5 py-3 text-sm font-bold text-[#160b26] hover:brightness-110"
              >
                Create a learning plan <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#roadmap-library"
                className="atlas-button inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-bold text-[#d8def0] hover:border-[#c084fc]/70 hover:text-white"
              >
                <BookOpen className="h-4 w-4" /> Browse the library
              </a>
            </div>
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 text-left sm:mt-10 sm:gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[.035] p-3 sm:p-4">
                <p className="text-2xl font-bold text-white">
                  {roadmapCatalog.length}
                </p>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8492ad]">
                  Roadmaps
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[.035] p-3 sm:p-4">
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8492ad]">
                  Topic nodes
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[.035] p-3 sm:p-4">
                <p className="text-2xl font-bold text-white">
                  {favorites.length}
                </p>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8492ad]">
                  Your favorites
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="roadmap-library"
          className="mx-auto max-w-[1200px] px-4 py-8 sm:py-10 lg:px-8 lg:py-14"
        >
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-[#c4b5fd]">
                Explore the paths
              </p>
              <h2 className="atlas-serif mt-2 text-4xl font-semibold tracking-[-.05em] text-white">
                Choose your direction.
              </h2>
            </div>
            <div className="text-sm text-[#8492ad]">
              {filtered.length.toLocaleString()} matching roadmaps
            </div>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_160px]">
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[.035] px-4 py-3 focus-within:border-[#8b5cf6]">
              <Search className="h-4 w-4 text-[#c084fc]" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search roadmaps…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#74819d]"
              />
            </label>
            <select
              value={category}
              onChange={event =>
                setCategory(event.target.value as "all" | RoadmapCategory)
              }
              className="rounded-lg border border-white/10 bg-[#111a2c] px-3 py-3 text-sm text-[#c1c9dc] outline-none focus:border-[#8b5cf6]"
            >
              <option value="all">All types</option>
              <option value="role">Role-based</option>
              <option value="skill">Skill-based</option>
            </select>
            <Link
              href="/roadmaps/plan"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#8b5cf6]/50 bg-[#8b5cf6]/10 px-3 py-3 text-sm font-bold text-[#d8b4fe] hover:bg-[#8b5cf6]/20"
            >
              <Sparkles className="h-4 w-4" /> Use AI
            </Link>
          </div>

          {roles.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Role-based Roadmaps
                  </h3>
                  <p className="mt-1 text-sm text-[#8492ad]">
                    Follow a path toward the work you want to do.
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[.14em] text-[#66748f]">
                  {roles.length} paths
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map(roadmap => (
                  <RoadmapCard
                    key={roadmap.slug}
                    roadmap={roadmap}
                    favorite={favorites.includes(roadmap.slug)}
                    onFavorite={() => toggleFavorite(roadmap.slug)}
                  />
                ))}
              </div>
            </section>
          )}
          {skills.length > 0 && (
            <section className="mt-12">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Skill-based Roadmaps
                  </h3>
                  <p className="mt-1 text-sm text-[#8492ad]">
                    Build depth in a technology, discipline, or core idea.
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[.14em] text-[#66748f]">
                  {skills.length} paths
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map(roadmap => (
                  <RoadmapCard
                    key={roadmap.slug}
                    roadmap={roadmap}
                    favorite={favorites.includes(roadmap.slug)}
                    onFavorite={() => toggleFavorite(roadmap.slug)}
                  />
                ))}
              </div>
            </section>
          )}
          {!filtered.length && (
            <div className="mt-10 rounded-xl border border-dashed border-white/15 p-12 text-center">
              <Search className="mx-auto h-8 w-8 text-[#687691]" />
              <p className="mt-4 font-bold text-white">
                No roadmap matches that search.
              </p>
              <p className="mt-2 text-sm text-[#8492ad]">
                Try a broader title, technology, or role.
              </p>
            </div>
          )}
        </section>

        <section id="about" className="border-t border-white/10 bg-[#0e1728]">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-[#c4b5fd]">
                How Atlas works
              </p>
              <h2 className="atlas-serif mt-3 text-4xl font-semibold tracking-[-.05em] text-white">
                A roadmap is a graph, not a checklist.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#9daac2]">
                Every path is backed by topic nodes and public learning
                material. Atlas can later use your goals, time, confidence, and
                completed work to assemble a plan that is explainable and easy
                to adjust.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-white/10 bg-white/[.035] p-3 sm:p-4">
                <p className="font-bold text-white">1. Pick a goal</p>
                <p className="mt-1 text-xs leading-5 text-[#8492ad]">
                  Choose a role, skill, or destination.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[.035] p-3 sm:p-4">
                <p className="font-bold text-white">2. Explore the graph</p>
                <p className="mt-1 text-xs leading-5 text-[#8492ad]">
                  See what to learn and why it matters.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[.035] p-3 sm:p-4">
                <p className="font-bold text-white">3. Make it yours</p>
                <p className="mt-1 text-xs leading-5 text-[#8492ad]">
                  Track progress, save notes, and shape the pace.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-[#66748f]">
        Atlas learning paths · public-source content model ·{" "}
        <a
          href="https://github.com/nilbuild/developer-roadmap"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[#9a8bff] hover:text-white"
        >
          content provenance <ExternalLink className="h-3 w-3" />
        </a>
      </footer>
    </div>
  );
}
