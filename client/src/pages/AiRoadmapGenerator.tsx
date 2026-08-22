import { useEffect, useState } from "react";
import { BookOpen, FileText, Loader2, Map, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { generateAiRoadmap } from "@/lib/atlasState";

export default function AiRoadmapGenerator() {
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<"course" | "guide" | "roadmap">(
    "roadmap"
  );
  const [customise, setCustomise] = useState(false);
  const [level, setLevel] = useState("beginner");
  const [hours, setHours] = useState("5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const title = new URLSearchParams(window.location.search).get("title");
    if (title) setTopic(title);
  }, []);

  async function generate() {
    const value = topic.trim();
    if (value.length < 3 || busy) return;
    if (format !== "roadmap") {
      setError(
        `${format[0].toUpperCase()}${format.slice(1)} generation is next. Roadmap generation is live now.`
      );
      return;
    }
    setBusy(true);
    setError("");
    const roadmap = await generateAiRoadmap({
      topic: value,
      level: customise ? level : "beginner",
      hours: customise ? Number(hours) : 5,
      customise,
    });
    setBusy(false);
    if (!roadmap) {
      setError(
        "Atlas could not generate the roadmap right now. Please try again."
      );
      return;
    }
    sessionStorage.setItem(
      "atlas-generated-roadmap",
      JSON.stringify({
        ...roadmap,
        generatedAt: new Date().toISOString(),
        request: { topic: value, format, level, hours },
      })
    );
    navigate("/ai/roadmap/result");
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#111827]">
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/roadmaps")}
            className="flex items-center gap-2 text-sm font-bold text-[#252c38] hover:text-[#6d4aff]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#111827] text-lg font-black text-white">
              r.
            </span>
            <span>Atlas AI Tutor</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-[#697386] hover:text-[#111827]"
          >
            Atlas explorer
          </button>
        </div>
      </header>
      <main className="mx-auto flex max-w-[760px] flex-col px-5 py-14 sm:px-8 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-[-.05em] text-[#111827] sm:text-5xl">
            What can I help you learn?
          </h1>
          <p className="mt-3 text-base text-[#697386] sm:text-lg">
            Enter a topic below to generate a personalized roadmap for it
          </p>
        </div>
        <form
          onSubmit={event => {
            event.preventDefault();
            void generate();
          }}
          className="mt-12 space-y-4"
        >
          <label className="block">
            <span className="mb-2 block text-sm text-[#697386]">
              What can I help you learn?
            </span>
            <input
              value={topic}
              onChange={event => setTopic(event.target.value)}
              placeholder="Enter a topic"
              minLength={3}
              required
              className="block w-full rounded-xl border border-[#dfe3e9] bg-white p-4 text-base outline-none transition focus:border-[#7a62e8] focus:ring-4 focus:ring-[#7a62e8]/10"
            />
          </label>
          <div>
            <span className="mb-2 block text-sm text-[#697386]">
              Choose the format
            </span>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat("course")}
                className={`flex min-h-[124px] flex-col items-center justify-center rounded-xl border bg-white p-4 transition ${format === "course" ? "border-[#7a62e8] ring-2 ring-[#7a62e8]/10" : "border-[#e4e7ec] hover:border-[#b9bfc9]"}`}
              >
                <BookOpen
                  className={`h-7 w-7 ${format === "course" ? "text-[#7a62e8]" : "text-[#9aa3af]"}`}
                />
                <span
                  className={`mt-3 text-sm font-medium ${format === "course" ? "text-[#111827]" : "text-[#9aa3af]"}`}
                >
                  Course
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("guide")}
                className={`flex min-h-[124px] flex-col items-center justify-center rounded-xl border bg-white p-4 transition ${format === "guide" ? "border-[#7a62e8] ring-2 ring-[#7a62e8]/10" : "border-[#e4e7ec] hover:border-[#b9bfc9]"}`}
              >
                <FileText
                  className={`h-7 w-7 ${format === "guide" ? "text-[#7a62e8]" : "text-[#9aa3af]"}`}
                />
                <span
                  className={`mt-3 text-sm font-medium ${format === "guide" ? "text-[#111827]" : "text-[#9aa3af]"}`}
                >
                  Guide
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("roadmap")}
                className={`flex min-h-[124px] flex-col items-center justify-center rounded-xl border bg-white p-4 transition ${format === "roadmap" ? "border-[#111827] ring-2 ring-[#111827]/10" : "border-[#e4e7ec] hover:border-[#b9bfc9]"}`}
              >
                <Map
                  className={`h-7 w-7 ${format === "roadmap" ? "text-[#111827]" : "text-[#9aa3af]"}`}
                />
                <span
                  className={`mt-3 text-sm font-medium ${format === "roadmap" ? "text-[#111827]" : "text-[#9aa3af]"}`}
                >
                  Roadmap
                </span>
              </button>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e4e7ec] bg-white p-4">
            <input
              type="checkbox"
              checked={customise}
              onChange={event => setCustomise(event.target.checked)}
              className="h-5 w-5 accent-[#111827]"
            />
            <span className="text-sm font-medium text-[#252c38]">
              Customize your roadmap{" "}
              <span className="font-normal text-[#8b95a4]">(optional)</span>
            </span>
          </label>
          {customise && (
            <div className="grid gap-3 rounded-xl border border-[#e4e7ec] bg-white p-4 sm:grid-cols-2">
              <label className="text-sm text-[#697386]">
                Your level
                <select
                  value={level}
                  onChange={event => setLevel(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#dfe3e9] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#7a62e8]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="some">I know the basics</option>
                  <option value="working">Already working in this area</option>
                  <option value="career">Career transition</option>
                </select>
              </label>
              <label className="text-sm text-[#697386]">
                Hours per week
                <select
                  value={hours}
                  onChange={event => setHours(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#dfe3e9] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#7a62e8]"
                >
                  <option value="2">2 hours</option>
                  <option value="5">5 hours</option>
                  <option value="10">10 hours</option>
                  <option value="15">15+ hours</option>
                </select>
              </label>
            </div>
          )}
          <button
            type="submit"
            disabled={topic.trim().length < 3 || busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black p-4 text-base font-medium text-white transition hover:bg-[#202020] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Generating your
                roadmap…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" /> Generate
              </>
            )}
          </button>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
        <p className="mt-7 text-center text-xs leading-5 text-[#8b95a4]">
          Atlas generates a fast starting map in one response. You can open any
          topic afterward for explanations, practice, progress, and chat.
        </p>
      </main>
    </div>
  );
}
