# Live roadmap.sh AI generation findings

Tested the public URL `https://roadmap.sh/ai/roadmap?title=Copywriting` on 2026-08-22.

The generator is a single-screen flow. It displays one text input prefilled with `Copywriting`, three format buttons (`Course`, `Guide`, `Roadmap`), an unchecked option labeled `Answer the following questions for a better roadmap`, and one `Generate` button. The default roadmap path does not expose an interview or required follow-up form before submission.

When `Generate` was clicked without authentication, the site opened a `Login or Signup` modal and stated: `You must be logged in to perform this action.` The public page therefore does not allow an unauthenticated end-to-end generation test. The modal offered GitHub, Google, LinkedIn, Apple, and email sign-in options. No sign-in or account-changing action was performed.

The visible public navigation identifies the product’s creation formats as Plan, Course, Guide, Roadmap, and Quiz. The public AI Tutor page also advertises a customization option, but the default roadmap flow shown in the user screenshots and observed here is intentionally fast: topic + format + Generate, with optional customization rather than a mandatory interview.

Implication for Atlas: the default plan generation should be one submit, no forced follow-up questions, and should return a usable roadmap immediately. Optional customization can be offered behind a checkbox or secondary control. Any AI answer should be server-side and must be tested separately from the public roadmap.sh flow because the real service requires authentication.

## References

- https://roadmap.sh/ai/roadmap?title=Copywriting
- https://roadmap.sh/ai
- https://roadmap.sh/ai/roadmap-chat/backend
- https://roadmap.sh/premium

## Additional route and bundle findings

The direct route `https://roadmap.sh/ai/roadmap/search?term=Copywriting&format=roadmap` redirected to `https://roadmap.sh/login`, confirming that generated roadmap creation is authenticated and cannot be passively tested end-to-end without signing in.

Static inspection of the public AI bundles found that the generator form submits the topic using query parameters `term`, `id`, and `format`; `id` is a local-storage session identifier for optional question answers. The default path submits with an empty answer-session ID and does not invoke the question generator. The optional customization component calls an AI-question suggestion hook using `term`, `format`, and `from=content`, then presents generated questions one at a time. The UI text for that optional mode is `Generating personalized questions...`, followed by a `Preferences saved` state. The public code calls `/v1-ai-question-suggestions` for optional questions, while the generated content route is a client-side navigation to `/ai/roadmap/search`.

The public AI helper bundle also exposes authenticated account-related endpoints for AI limits, daily goals and projects, personalized suggestions, and AI question suggestions. The public repository’s content-first codebase does not include the private AI generation handler or provider/model configuration.

## Implementation decision

Atlas should make the default flow a single submit with no follow-up questions. It should treat optional customization as opt-in and separate. Its first request should return a useful roadmap quickly, using a compact candidate context and structured output. The deployed Worker should expose this through `/api/ai/plan`, with a verified AI binding or explicit provider fallback, and should report which mode was used (`ai` versus `fallback`) instead of silently presenting deterministic output as AI.
