import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles, Target, WandSparkles } from "lucide-react";
import { roadmapCatalog } from "@/data/roadmapCatalog";
import { syncAtlasAction } from "@/lib/atlasState";
type Topic = { id: string; roadmapSlug: string; title: string; summary: string; slug: string };
const PLAN_KEY = "atlas-learning-plan";

function searchRoadmap(goal: string, level: string) {
  const normalized = goal.toLowerCase();
  const direct = roadmapCatalog.find((roadmap) => normalized.includes(roadmap.title.toLowerCase()) || normalized.includes(roadmap.slug.replaceAll("-", " ")));
  if (direct) return direct;
  if (level === "career") return roadmapCatalog.find((roadmap) => roadmap.category === "role") || roadmapCatalog[0];
  return roadmapCatalog.find((roadmap) => roadmap.category === "skill") || roadmapCatalog[0];
}

export default function RoadmapPlan() {
  const [topicData, setTopicData] = useState<Topic[]>([]);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [hours, setHours] = useState("5");
  const [pace, setPace] = useState("steady");
  const [generated, setGenerated] = useState(false);
  const selectedRoadmap = useMemo(() => searchRoadmap(goal, level), [goal, level]);
  const planTopics = useMemo(() => topicData.filter((topic) => topic.roadmapSlug === selectedRoadmap.slug).slice(0, pace === "fast" ? 8 : pace === "deep" ? 4 : 6), [topicData, selectedRoadmap.slug, pace]);

  useEffect(() => {
    fetch("/data/roadmap-content.json")
      .then((response) => response.json() as Promise<Topic[]>)
      .then(setTopicData)
      .catch(() => setTopicData([]));
  }, []);

  function generate() {
    setGenerated(true);
    const plan = { goal, level, hours, pace, roadmapSlug: selectedRoadmap.slug, topicIds: planTopics.map((topic) => topic.id), createdAt: new Date().toISOString() };
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    void syncAtlasAction({ action: "plan", ...plan });
  }

  return <div className="min-h-screen bg-[#0b1220] text-[#f6f4ff]"><header className="border-b border-white/10 bg-[#0b1220]/95"><div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-4 lg:px-8"><Link href="/roadmaps" className="inline-flex items-center gap-2 text-sm font-bold text-[#b9c3da] hover:text-white"><ArrowLeft className="h-4 w-4" /> Roadmaps</Link><Link href="/" className="text-xs font-bold text-[#8b9ab6] hover:text-white">Atlas explorer</Link></div></header><main className="mx-auto max-w-[1100px] px-4 py-10 lg:px-8 lg:py-16"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"><section><p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-[#c4b5fd]">Atlas AI Tutor · private prototype</p><h1 className="atlas-serif mt-4 max-w-2xl text-5xl font-semibold tracking-[-.06em] text-white sm:text-6xl">Build a learning path around your life.</h1><p className="mt-5 max-w-xl text-base leading-7 text-[#a9b4cb]">Tell Atlas what you want to learn, how much time you have, and how deep you want to go. The prototype selects public Atlas topics and turns them into an explainable starting sequence.</p><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/[.035] p-4"><Target className="h-5 w-5 text-[#c084fc]" /><p className="mt-4 font-bold text-white">Goal first</p><p className="mt-1 text-xs leading-5 text-[#8492ad]">Start from the outcome you care about.</p></div><div className="rounded-xl border border-white/10 bg-white/[.035] p-4"><Clock3 className="h-5 w-5 text-[#c084fc]" /><p className="mt-4 font-bold text-white">Fits your pace</p><p className="mt-1 text-xs leading-5 text-[#8492ad]">Choose a realistic weekly commitment.</p></div><div className="rounded-xl border border-white/10 bg-white/[.035] p-4"><Sparkles className="h-5 w-5 text-[#c084fc]" /><p className="mt-4 font-bold text-white">Explainable</p><p className="mt-1 text-xs leading-5 text-[#8492ad]">Every step points back to a topic.</p></div></div></section><section className="rounded-2xl border border-white/10 bg-[#111a2c] p-5 shadow-2xl shadow-black/30 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#8b5cf6]/15 text-[#d8b4fe]"><WandSparkles className="h-5 w-5" /></span><div><p className="font-bold text-white">Create a plan</p><p className="text-xs text-[#8492ad]">Takes less than a minute</p></div></div><label className="mt-7 block"><span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">What do you want to learn?</span><textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. I want to become a backend engineer…" rows={4} className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none placeholder:text-[#65728c] focus:border-[#8b5cf6]" /></label><label className="mt-5 block"><span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">Where are you today?</span><select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none focus:border-[#8b5cf6]"><option value="beginner">Starting from the beginning</option><option value="some">I know the basics</option><option value="working">I already work in this area</option><option value="career">I want a role transition</option></select></label><div className="mt-5 grid gap-3 sm:grid-cols-2"><label><span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">Hours per week</span><select value={hours} onChange={(event) => setHours(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none focus:border-[#8b5cf6]"><option value="2">2 hours</option><option value="5">5 hours</option><option value="10">10 hours</option><option value="15">15+ hours</option></select></label><label><span className="text-xs font-extrabold uppercase tracking-[.14em] text-[#aab6cd]">Depth</span><select value={pace} onChange={(event) => setPace(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1627] px-3 py-3 text-sm text-white outline-none focus:border-[#8b5cf6]"><option value="fast">Fast start</option><option value="steady">Steady path</option><option value="deep">Deep foundation</option></select></label></div><button type="button" onClick={generate} disabled={!goal.trim()} className="atlas-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#c084fc] to-[#8b5cf6] px-4 py-3 text-sm font-bold text-[#160b26] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">Generate my plan <ArrowRight className="h-4 w-4" /></button></section></div>
      {generated && <section className="mt-10 rounded-2xl border border-[#8b5cf6]/40 bg-[#8b5cf6]/[.08] p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#d8b4fe]">Your starting route</p><h2 className="atlas-serif mt-2 text-3xl font-semibold tracking-[-.05em] text-white">{selectedRoadmap.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb8ce]">A {pace} sequence for {hours} hours per week, starting at “{level}”. Atlas selected these public topic nodes as a first pass.</p></div><Link href={`/roadmaps/${selectedRoadmap.slug}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-[#e4e8f4] hover:border-[#c084fc] hover:text-white">Open roadmap <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-6 grid gap-3 md:grid-cols-2">{planTopics.map((topic, index) => <div key={topic.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0f182a]/80 p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c084fc]/15 text-xs font-bold text-[#d8b4fe]">{index + 1}</span><div><p className="font-bold text-white">{topic.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#96a3bb]">{topic.summary}</p></div><Check className="ml-auto mt-1 h-4 w-4 shrink-0 text-[#c084fc]" /></div>)}</div></section>}
    </main></div>;
}
