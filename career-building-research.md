# Career-building system research

## Current Atlas audit

The current Graph succeeds at discovery, grounded selection, route memory, and source-labelled record traversal. The current Roadmaps tab successfully turns an O*NET occupation, its skills, and a subset of its tasks into an ordered local checklist. It does not yet help a user decide whether a role fits them, assess preparation requirements, compare adjacent roles, understand market outlook or location, identify a defensible proof-of-work action, or carry a plan across role transitions.

## Career-navigation design principles

Jobs for the Future describes a complete career-navigation system as one that helps people understand interests, related opportunities, and required skills, education, and training; it also calls for individualized plans, local labor-market insight, and social capital rather than isolated occupational descriptions.[1]

The direct Atlas implication is to move from a **record sequence** to a **decision workspace**. Each selected occupation should answer: “What is this work?”, “What preparation is commonly required?”, “What evidence would show readiness?”, “What adjacent roles share useful skills?”, and “What should I do next?” The system must label personal answers as self-reported, preserve the official source for labor facts, and avoid presenting a completion checklist as a hiring guarantee.

## Official skills-framework precedent

Singapore’s Skills Frameworks expose the combination that Atlas should target: sector, role, key tasks, skills, and training; its downloadable dataset covers job roles, key tasks, skills, proficiency levels, and knowledge/abilities across 38 sectors and is updated quarterly.[2] This demonstrates that a pathway should be a structured, versioned relation among real work, capability, and preparation—not an unsourced list of course links.

## Immediate product implication

The highest-value next interface is an **Evidence and Readiness panel** inside Roadmaps. It should combine current O*NET profile/skills/tasks with a transparent user-owned “I can evidence this” state. The first release can use only existing Atlas records: users mark skills as `can demonstrate`, `learning`, or `not started`; the system summarizes the result against the selected occupation’s O*NET-recorded skills without assigning an invented employability score. A subsequent source refresh can add O*NET Job Zones, education/training frequencies, related occupations, work values, interests, software skills, and BLS projections.

## Official source expansion opportunities

O*NET 30.3 already provides a credible deepening path beyond the files currently shipped in the Atlas: job zones; education, training, and experience frequencies; career interests; work styles; software skills; related occupations; alternate titles; work context; and detailed work-activity mappings. O*NET’s release documentation also notes 41 specific interest areas and updated employer-based technology designations, while retaining a Creative Commons licensing route for the database.[3]

The BLS Employment Projections program supplies a national ten-year outlook, with the current published 2024–34 data and explicit occupational, industry, education/training, and skills tables. This should be displayed as a dated national projection—not a promise of an individual job outcome.[4]

CareerOneStop’s documented occupation endpoint demonstrates a useful **integrated evidence card**: O*NET attributes, national/state/local wages, projections, education/training, related occupations, programs, tools/technology, and links to state labor-market information. It requires an API token and user ID, so it is a later backend integration rather than a static-client dependency.[5]

College Scorecard can support a carefully scoped U.S. postsecondary comparison workflow because its API exposes institution- and field-of-study-level data, including costs, completion, admissions, and earnings. It requires an API key and enforces a default 1,000-request-per-IP-per-hour rate limit; it therefore belongs behind a server-side cache and must never be presented as a universal training ranking.[6]

Credential Engine can make credential information more transparent, but its API requires an organization account, a temporary 90-day testing key, and then a developer or equivalent agreement. It is valuable for a future verified-credential registry connector, not an unauthenticated bulk data source.[7]

## Local implementation validation — 14 August 2026

The revised Roadmaps tab now renders the official O*NET Job Zone, most-reported education, related work experience, and on-site training facts directly from the cached O*NET 30.3 archive. For example, the Bookkeeping, Accounting, and Auditing Clerks path displayed Job Zone 3, a high-school-diploma modal education response, related-experience and on-site-training modal responses, and four O*NET related occupations. The panel labels those alternatives as occupational relatedness rather than a promotion promise.

The local readiness board successfully changed a recorded skill from `Not started` to `Can evidence` and updated its own count. This state stays browser-local and is explicitly presented as a reflection tool, not an employability score. Selecting a related occupation replaced the full evidence path with that official record’s preparation profile, skills, tasks, and related roles.

The companion Directory remained functional after the release rebuild, preserving its official NAICS/ISIC tree browsing, O*NET occupation profiles, and joined BLS 2025 wage/employment display. The Graph overview also retained cursor-centered exploration controls and now displays factual NAICS coordinate labels, non-relational sector-field contours, and a persistent semantic map key. These cues communicate structure and evidence without implying unsupported industry-to-occupation links.

## References

[1]: https://www.jff.org/idea/framework/career-navigation/ "Jobs for the Future — Career Navigation Systems"
[2]: https://jobsandskills.swda.gov.sg/frameworks/skills-frameworks "SkillsFuture Singapore — Skills Frameworks"
[3]: https://www.onetcenter.org/database.html "O*NET 30.3 Database — O*NET Resource Center"
[4]: https://www.bls.gov/emp/ "Employment Projections — U.S. Bureau of Labor Statistics"
[5]: https://www.careeronestop.org/Developers/WebAPI/Occupation/get-occupation-details.aspx "CareerOneStop — Get Occupation Details API"
[6]: https://collegescorecard.ed.gov/data/api-documentation/ "College Scorecard API Documentation"
[7]: https://credentialengine.org/develop-solutions/apis/ "Credential Engine APIs"
