# Career-building upgrade plan

## Product thesis

The Atlas should become a **career decision workspace**, not a content directory. A person should be able to explore a real occupation, see the formal work evidence, understand common preparation, identify comparable or adjacent roles, record their own evidence of readiness, and leave with one concrete next action. It must not claim to predict employability, guarantee salary, recommend a school as “best,” or imply that a related occupation is an automatic promotion.

## Research synthesis

Jobs for the Future frames career navigation around interests, opportunity, skills, education/training, individualized plans, local labor-market information, and social capital.[1] SkillsFuture’s government-developed framework makes the operational unit explicit: sector → role → tasks → skills → training, with versioned data and proficiency details.[2] Forage shows the value of a bounded external “try the work” action but remains an external provider, not Atlas content.[3]

O*NET 30.3 already provides the most immediately useful source expansion: job zones, education/training/experience frequencies, interests, work styles, technology skills, alternate titles, and related occupations.[4] BLS Employment Projections can later add dated national outlook; CareerOneStop can add location-specific wage, training, and related-role cards through a credentialed backend.[5] [6]

## Priority roadmap

| Priority | Product addition | Evidence source | User value | Integrity rule |
|---|---|---|---|---|
| **Now** | Readiness canvas: preparation profile + self-owned skill evidence | Existing O*NET archive | Converts a role description into a bounded preparation and practice plan | Show official frequencies separately from user self-report; no employability score |
| **Now** | Related-role explorer | O*NET Related Occupations | Gives useful alternatives when a target role is a poor fit or long-term goal | Label as O*NET occupational relatedness, not a career ladder |
| **Now** | Proof-of-work prompt per task cluster | O*NET tasks/work activities; external-search handoffs | Gives a next action beyond “read a skill” | Prompts are practice ideas, not official requirements or hiring tests |
| **Next** | National outlook and wage context | BLS EP + existing OEWS | Adds demand, scale, and wage context to a target role | Always show source vintage and geography; never predict an individual outcome |
| **Next** | Interests and work-style reflection | O*NET interests/work styles | Helps compare role preferences with work characteristics | Keep reflection local and voluntary; do not diagnose fit |
| **Next** | Location-aware training and wage cards | CareerOneStop API | Connects role choice to local practical options | Requires a backend, token, cache, and source/date label |
| **Later** | Verified credential and program registry | Credential Engine + College Scorecard | Enables transparent program and credential comparisons | Requires agreement/API keys and does not rank programs without disclosed logic |
| **Later** | Global country modules | ISCO/ISIC + national sources/ESCO | Expands beyond U.S. taxonomies and labor facts | Preserve native classifications and source-specific mappings |

## Immediate build contract: Readiness canvas

The Roadmaps tab will gain a **Role reality** block derived entirely from O*NET 30.3. It will show the occupation’s Job Zone and the official Job Zone reference description, plus the highest-frequency reported education, related experience, and on-site training categories. These values are descriptive survey evidence, not universal prerequisites.[4]

The existing skill checklist will be upgraded from binary completion to three personal states: **Can evidence**, **Practising**, and **Not started**. The user’s entries remain local to the browser. The summary will report only counts of O*NET-recorded skills in each user state; it will not label a person “ready,” assign a percentage score, or make a hiring claim.

The same block will offer a concise **practice prompt** connected to an official task statement. Prompts describe a way to document learning—such as explaining a task workflow, recreating a constrained task with public material, or keeping a work sample—not a certification or employer assessment.

## Data-release work

The current O*NET archive already contains the required CSV files. The data builder should add compact `preparation` and `relatedOccupations` fields to each release occupation. It should preserve the source date per field where available, cap lists to a usable size, and add no inferred relationships. The data release remains static and free to serve.

## References

[1]: https://www.jff.org/idea/framework/career-navigation/ "Jobs for the Future — Career Navigation Systems"
[2]: https://jobsandskills.swda.gov.sg/frameworks/skills-frameworks "SkillsFuture Singapore — Skills Frameworks"
[3]: https://www.theforage.com/simulations "Forage Job Simulations"
[4]: https://www.onetcenter.org/database.html "O*NET 30.3 Database — O*NET Resource Center"
[5]: https://www.bls.gov/emp/ "Employment Projections — U.S. Bureau of Labor Statistics"
[6]: https://www.careeronestop.org/Developers/WebAPI/Occupation/get-occupation-details.aspx "CareerOneStop — Get Occupation Details API"
