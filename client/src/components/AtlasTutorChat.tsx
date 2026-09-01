import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  Loader2,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Streamdown } from "streamdown";
import {
  askAtlasTutor,
  AtlasAiError,
  type AiChatResponse,
} from "@/lib/atlasState";

type Topic = { id: string; title: string; summary: string; slug: string };
type Message = {
  role: "user" | "assistant";
  content: string;
  topicIds?: string[];
  suggestions?: string[];
  actions?: AiChatResponse["actions"];
};

type Props = {
  roadmap: { slug: string; title: string; description: string };
  topics: Topic[];
  progress: Record<string, boolean>;
  notes: Record<string, string>;
  onToggleProgress: (topicId: string, completed?: boolean) => void;
  onSaveNote: (topicId: string, note: string) => void;
  onClose: () => void;
};

export default function AtlasTutorChat({
  roadmap,
  topics,
  progress,
  notes,
  onToggleProgress,
  onSaveNote,
  onClose,
}: Props) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I’m your Atlas learning assistant for **${roadmap.title}**. Ask me to explain a concept, find your next unfinished topic, or turn your progress into a practical study step.`,
      suggestions: [
        "What should I learn next?",
        "Explain the first unfinished topic",
        "How should I practice this roadmap?",
      ],
    },
  ]);

  const topicById = useMemo(
    () => new Map(topics.map(topic => [topic.id, topic])),
    [topics]
  );
  const unfinished = useMemo(
    () => topics.filter(topic => !progress[topic.id]).slice(0, 8),
    [topics, progress]
  );

  async function submit(rawQuestion = question) {
    const value = rawQuestion.trim();
    if (!value || busy) return;
    setQuestion("");
    const nextMessages = [
      ...messages,
      { role: "user" as const, content: value },
    ];
    setMessages(nextMessages);
    setBusy(true);
    let failure = "";
    const result = await askAtlasTutor({
      roadmap,
      question: value,
      topics: topics.slice(0, 80),
      progress,
      notes,
      history: nextMessages
        .slice(-8)
        .map(message => ({ role: message.role, content: message.content })),
    }).catch((thrown: unknown) => {
      // A rate limit is worth saying out loud in the transcript rather than
      // hiding behind the generic "couldn't reach the tutor" line.
      if (thrown instanceof AtlasAiError) failure = thrown.message;
      return null;
    });
    setBusy(false);
    if (!result) {
      setMessages(current => [
        ...current,
        {
          role: "assistant",
          content:
            failure ||
            "I couldn’t reach the tutor right now. Try again in a moment, or open the topic list and continue with the next unfinished topic.",
        },
      ]);
      return;
    }
    setMessages(current => [
      ...current,
      {
        role: "assistant",
        content: result.answer,
        topicIds: result.topicIds,
        suggestions: result.suggestedPrompts,
        actions: result.actions,
      },
    ]);
  }

  function applyAction(action: AiChatResponse["actions"][number]) {
    if (!action.topicId) return;
    if (action.type === "complete") onToggleProgress(action.topicId, true);
    if (action.type === "uncomplete") onToggleProgress(action.topicId, false);
    if (action.type === "save_note") onSaveNote(action.topicId, action.note);
  }

  return (
    <aside
      className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[520px] flex-col border-l border-white/10 bg-[#0d1627] pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black/50 max-sm:border-l-0"
      role="dialog"
      aria-modal="true"
      aria-label="Atlas AI Tutor"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8b5cf6]/20 text-[#d8b4fe]">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Atlas AI Tutor</p>
            <p className="text-[11px] text-[#8190ac]">
              Contextual to {roadmap.title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-[#aeb9cc] hover:border-white/25 hover:text-white"
          aria-label="Close AI Tutor"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <span
              className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full ${message.role === "assistant" ? "bg-[#8b5cf6]/20 text-[#d8b4fe]" : "bg-white/[.08] text-[#aeb9cc]"}`}
            >
              {message.role === "assistant" ? (
                <Bot className="h-3.5 w-3.5" />
              ) : (
                <UserRound className="h-3.5 w-3.5" />
              )}
            </span>
            <div
              className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "assistant" ? "rounded-tl-sm border border-white/10 bg-[#111d32] text-[#c4cde0]" : "rounded-tr-sm bg-[#8b5cf6] text-white"}`}
            >
              <div className="prose prose-invert prose-sm max-w-none prose-p:my-0 prose-p:leading-6 prose-strong:text-white">
                <Streamdown>{message.content}</Streamdown>
              </div>
              {message.topicIds && message.topicIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.topicIds.map(topicId => (
                    <span
                      key={topicId}
                      className="rounded-full border border-[#c084fc]/30 bg-[#8b5cf6]/10 px-2 py-1 text-[10px] font-bold text-[#d8b4fe]"
                    >
                      {topicById.get(topicId)?.title || "Roadmap topic"}
                    </span>
                  ))}
                </div>
              )}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.actions.map((action, actionIndex) => (
                    <button
                      key={`${action.type}-${actionIndex}`}
                      type="button"
                      onClick={() => applyAction(action)}
                      className="flex w-full items-start gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-left text-xs font-bold text-[#d3daea] hover:border-[#c084fc]/60 hover:text-white"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c084fc]" />
                      <span>
                        {action.type === "complete"
                          ? `Mark ${topicById.get(action.topicId)?.title || "topic"} complete`
                          : action.type === "save_note"
                            ? `Save a note on ${topicById.get(action.topicId)?.title || "topic"}`
                            : `Update ${topicById.get(action.topicId)?.title || "topic"}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void submit(suggestion)}
                      className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-[#aeb9cc] hover:border-[#c084fc]/60 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-3 text-xs text-[#8190ac]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#8b5cf6]/20 text-[#d8b4fe]">
              <Bot className="h-3.5 w-3.5" />
            </span>
            <span className="inline-flex items-center gap-2">
              Atlas is thinking <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </span>
          </div>
        )}
        {!busy && messages.length === 1 && unfinished.length > 0 && (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[.02] p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-[#c6cee0]">
              <Sparkles className="h-3.5 w-3.5 text-[#c084fc]" />
              Start with your roadmap context
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {unfinished.slice(0, 3).map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() =>
                    void submit(
                      `Explain ${topic.title} and tell me how to practice it.`
                    )
                  }
                  className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-[#aeb9cc] hover:border-[#c084fc]/60 hover:text-white"
                >
                  Explain {topic.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <form
        onSubmit={event => {
          event.preventDefault();
          void submit();
        }}
        className="border-t border-white/10 bg-[#0b1220] p-4"
      >
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-[#111a2c] p-2 focus-within:border-[#8b5cf6]">
          <textarea
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="Ask about this roadmap…"
            rows={2}
            className="min-h-[46px] max-h-32 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 text-white outline-none placeholder:text-[#687691]"
          />
          <button
            type="submit"
            disabled={!question.trim() || busy}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#8b5cf6] text-white transition hover:bg-[#9a6bff] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#687691]">
          Atlas uses the public roadmap topics plus your progress and notes.
          Verify important details before acting.
        </p>
      </form>
    </aside>
  );
}
