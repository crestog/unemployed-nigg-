# Industry Niche Atlas — Design Direction

## Three candidate approaches

### Theme Name: Editorial Cartography
Very Brief Intro: A research atlas that feels like a marked-up field guide: warm paper, ink lines, restrained color, and spatial navigation. It makes complex classification feel discoverable rather than bureaucratic.
Probability: 0.07

### Theme Name: Signal Room
Very Brief Intro: A dark analyst workspace with crisp charts, cobalt accents, and dense but controlled data panels. It prioritizes scanning, filtering, and comparison for power users.
Probability: 0.03

### Theme Name: Civic Index
Very Brief Intro: A calm public-information interface built around accessible typography, pale mineral colors, and modular cards. It emphasizes trust, clarity, and broad audience comprehension.
Probability: 0.05

## Chosen approach: Editorial Cartography

### Design Movement
Contemporary information design with references to editorial cartography, Swiss grid discipline, and annotated field guides. The atlas should feel authored and evidence-led, not like a generic analytics dashboard.

### Core Principles
1. **Orient before overwhelming:** Every view shows where the user is in the hierarchy and what the next useful question is.
2. **Evidence beside interpretation:** Counts, source labels, definitions, and caveats stay close to the visual they explain.
3. **Spatial curiosity:** Use map-like diagrams, paths, depth cues, and asymmetric composition to reward exploration.
4. **Human-scale detail:** The final niche view must explain actual work patterns, not stop at job titles or abstract skills.

### Color Philosophy
Use a warm mineral paper background as the base, near-black ink for high-legibility text, an ownable oxidized-teal accent for active paths and linked data, and a burnt-coral signal color for attention, uncertainty, or emerging niches. Colors should encode meaning rather than decorate: teal means connection and verified lineage; coral means change, opportunity, or an unresolved edge; ochre marks context and evidence.

### Layout Paradigm
Use an asymmetric research desk: a persistent left rail for hierarchy, a large spatial canvas for the map or chart, and a right-hand evidence drawer for the selected node. On small screens, the rail becomes a compact breadcrumb and the drawer becomes a bottom sheet. Avoid a centered marketing stack; let the visual field and evidence pane share the page.

### Signature Elements
1. **Atlas coordinates:** Every node gets a compact level badge and a breadcrumb-like lineage trail.
2. **Annotated connector lines:** Edges carry relationship labels such as “classified as,” “performed by,” or “requires.”
3. **Margin notes:** Sources, definitions, confidence, and “what this means” explanations appear as editorial callouts rather than hidden tooltips.

### Interaction Philosophy
Interactions should feel like tracing a route on a research map. Clicking a node moves the user one level deeper while preserving the previous lineage. Hover reveals a short definition; click opens the evidence drawer; “go deeper” continues the route; “compare” pins the node for a side-by-side view. Search should jump to a node but keep the user’s place visible.

### Animation
Use short, directional transitions: 180ms ease-out for controls, 240ms for the evidence drawer, and a 300ms crossfade/translate for moving between levels. Nodes should settle into place rather than pop from zero. Stagger only grouped labels by 30–50ms. Respect `prefers-reduced-motion` and keep keyboard navigation instantaneous.

### Typography System
Use **DM Serif Display** for large editorial headings and **IBM Plex Sans** for interface text, labels, and data. Headings should be compact and expressive; body copy should remain at 15–17px with generous line-height; metadata is uppercase or small-caps at 11–12px with letter spacing. Use monospace only for codes, coordinates, and source identifiers.

### Brand Essence
An evidence-backed atlas for people who want to move from broad industries to the real work inside them—without losing the thread. Personality: **curious, grounded, precise**.

### Brand Voice
Headlines are specific and inviting, CTAs sound like research actions, and microcopy explains the why behind each control. Avoid hype, generic onboarding language, and unsupported precision.

Example lines:
- “Start broad. Follow the work.”
- “This path ends where a person’s week actually begins.”

### Wordmark & Logo
Use a compact compass-cross mark made from four offset brackets that imply a map coordinate and a branching taxonomy. The wordmark should be set in a serif display face with a slightly oversized “A” glyph and a thin teal rule beneath it; the icon must work independently as a favicon and node marker.

### Signature Brand Color
**Oxidized Teal — `#0F766E`**. It reads as institutional enough for evidence, but more distinctive and human than generic blue.

## Research notes captured during initial review

- The Federal Reserve Bank of Philadelphia’s Occupational Mobility Explorer starts with location and job title, then visualizes skill overlap to higher-paying occupations. It demonstrates the value of a clear “build your path” flow, explicit location context, and adjacent source/documentation links.
- Andrej Karpathy’s US Job Market Visualizer uses a visual treemap for 342 BLS occupations and maps area to employment while switching color between outlook, pay, education, and estimated digital-AI exposure. It demonstrates that one visual surface can support multiple lenses, but also that caveats need to be visible when derived scores are interpretive.
- Both examples support the atlas direction: preserve a stable map canvas, expose multiple metrics as layers, and pair every visual with data-source and methodology context.

## Style Decisions

- Every major section must include a functional cartographic artifact: a coordinate badge, lineage trail, annotated connector, or margin note.
- Teal `#0F766E` means verified connection or active lineage; burnt coral means uncertainty or emerging change; ochre means context or evidence.
- The main explorer canvas favors branching diagrams with labeled relationships over a simple timeline or generic card stack.
- The atlas uses roadmap-style stages as an optional route: orient, narrow, enter work, find capability, see the task, inspect evidence.
- Roadmap stages are navigational affordances, not claims of an official industry-to-occupation crosswalk; unsupported jumps remain visibly labeled as exploratory.
- Search is a unified jump tool, while the default experience is click-led wandering through a shared selection state across every visual view.
- The primary surface is a full-screen, infinitely pannable/zoomable map; page sections support the map but never compete with it.
- Labels are scale-dependent: world view exposes clusters, medium zoom exposes record names, and close zoom exposes the inspector and record detail.
- The inspector is persistent but collapsible, so evidence is always available without shrinking the map into a dashboard card.
