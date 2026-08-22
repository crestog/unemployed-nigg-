# Atlas AI Tutor behavior map

## Publicly observable roadmap.sh behavior

The public AI Tutor page presents a single entry point, “What can I help you learn?”, where a learner enters a topic and chooses a generated format. The public page lists **Course**, **Guide**, and **Roadmap** as visible output formats and exposes a customization step before generation. The broader public product language also advertises quizzes, instant answers, career guidance, a personal coach, and an AI learning companion.

The public Roadmap Chat pages show a second interaction mode attached to a specific roadmap. The assistant is framed as a contextual learning companion that can explain roadmap concepts, read and summarize progress, recommend the next topic or another roadmap, find resources for a topic, and generate a shareable progress link. The assistant is explicitly described as having access to the learner’s current roadmap progress, which is the key distinction between a generic chatbot and a roadmap-aware tutor.

## What Atlas currently does

The current `/roadmaps/plan` form collects a goal, current level, hours per week, and depth. Its generation step chooses a roadmap by string matching and returns the first few topic records according to the requested pace. It does not yet call a model, ask clarifying questions, explain why a topic was chosen, generate projects or assessments, or use notes/progress as conversational context.

## Recommended Atlas AI behavior

Atlas should use a two-stage interaction. First, it should run a lightweight learner interview: normalize the goal, identify the likely roadmap, ask at most two high-value follow-up questions when confidence is low, and confirm the learner’s constraints. Second, it should generate a structured plan grounded in the selected roadmap’s real node and topic records. The result should contain a concise goal interpretation, assumptions, a sequence of selected topic IDs, why each topic matters, a practical project or artifact for each phase, an estimated weekly rhythm, checkpoints, and explicit uncertainty where the public data does not justify a claim.

A roadmap-aware chat should be a separate panel or route tied to `/roadmaps/:slug`. It should accept learner questions, send only the relevant roadmap metadata, topic summaries, progress, and notes as context, and support safe actions such as explaining a topic, recommending the next unfinished prerequisite, listing the topic’s public resources, marking a topic complete, and saving a note. The model should not be allowed to invent that a topic is present on a roadmap or claim a resource exists unless it is found in the supplied data.

## Architecture implication

The model must run server-side. The browser should call an Atlas API endpoint and never receive a model API key. The endpoint should use structured JSON output, validate every selected topic ID against the supplied roadmap data, cap the number of topics and output length, and persist the resulting plan plus a traceable prompt/input summary. Local storage remains an offline fallback, while the deployed Worker/D1 layer stores plans, progress, notes, and eventually chat sessions.

## Public-reference boundaries

This note records user-facing behavior visible on roadmap.sh’s public AI pages. It does not claim access to roadmap.sh’s private prompt templates, model provider, backend implementation, account data, or internal ranking logic. Atlas will reproduce the observable capabilities with its own prompts, state model, and server-side implementation.

## References

1. [roadmap.sh AI Tutor](https://roadmap.sh/ai)
2. [roadmap.sh Backend Roadmap Chat](https://roadmap.sh/ai/roadmap-chat/backend)
3. [roadmap.sh Frontend Roadmap Chat](https://roadmap.sh/ai/roadmap-chat/frontend)
4. [roadmap.sh Premium AI features](https://roadmap.sh/premium)
