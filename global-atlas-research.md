# Global Atlas Research Notes

## Roadmap-to-learning design findings

The official roadmap.sh description identifies four relevant mechanics: role-based and skill-based learning paths, interactive nodes with attached learning resources, user progress tracking, and a community/expert review process for content. Its public content repository stores one Markdown file per roadmap topic, linked to a visual node by a durable node identifier. The atlas can adopt the **interaction model**—a scoped next-step path after exploration—without copying roadmap.sh content, which its own site says cannot be redistributed. Sources: <https://roadmap.sh/about>; <https://github.com/nilbuild/developer-roadmap>.

## Global occupation backbone

The ILO describes ISCO-08 as an internationally comparable occupation framework. It has 10 major groups, 43 sub-major groups, 130 minor groups, and 436 unit groups, with jobs defined as task-and-duty bundles and occupations as groups of jobs with substantially similar tasks. ISCO provides the appropriate global spine for country mappings; national occupation systems should attach as local extensions or crosswalks, rather than replacing the global layer. The ILO also provides downloadable structure, index, and correspondence files. Source: <https://ilostat.ilo.org/methods/concepts-and-definitions/classification-occupation/>.

## Current implementation audit

The atlas already provides real official classification and O*NET data, map-first exploration, click paths, search, directory lookup, a persistent local route, shareable camera state, and O*NET skill/task neighborhoods. The immediate gaps are a real global occupation spine, country-specific crosswalks and labor signals, clearly bounded learning next steps, multi-record comparison, lasso selection, scan mode, session review, and a provenance-first job-market layer.

## Learning-resource and video layer

Filmot’s public site presents search over YouTube subtitles, captions, and transcripts, including automatic and manual subtitle search. The visible public interface does not document a first-party API or redistribution terms for programmatic embedding, so the safe first integration is an outbound Filmot search link built from the selected real record’s title and context—not copied Filmot results or scraped transcripts. Source: <https://filmot.com/>.

The public Filmot interface accepts free-text subtitle queries and offers separate automatic- and manual-subtitle search actions. The atlas learning panel will make this explicit: `Search captions in Filmot` opens an external query in a new tab; Filmot remains the search provider and no captions, result ranking, or channel metadata are imported into the atlas.

For in-product video discovery, the official YouTube Data API `search.list` endpoint supports keyword search and can restrict result type to videos; its `regionCode` parameter supports country-aware availability. Any production use needs API credentials, an appropriate backend proxy, and compliance with YouTube API terms and developer policies. The static atlas can offer transparent external YouTube and Filmot search links now, then add a first-party API-backed results card only after a compliant credentialed backend is enabled. Sources: <https://developers.google.com/youtube/v3/docs/search/list>; <https://developers.google.com/youtube/terms/developer-policies>.

## Global industry and country labour signals

UNSD presents ISIC Rev. 5 as a standard classification of productive activities with four levels: 22 sections, 87 divisions, 258 groups, and 463 classes. This is the natural cross-country industry spine, with NAICS, NACE, ANZSIC, and other national systems stored as explicitly versioned crosswalks. Source: <https://unstats.un.org/unsd/classifications/Family/Detail/2095>.

ILOSTAT’s bulk facility provides compressed CSV datasets, data dictionaries, and metadata organized by indicator or reference area. Its documentation describes country, regional, and global reference areas and roughly 500 indicator-oriented and 700 reference-area files. It is suitable for scheduled aggregation of official employment, unemployment, participation, and activity signals; every imported measure must retain its indicator, classification, frequency, unit, source, time, and note metadata. Source: <https://ilostat.ilo.org/data/bulk/>.

Adzuna documents a credentialed REST API for job-ad search plus salary, historical, regional vacancy, company, category, and version endpoints. It can be evaluated as an explicitly permissioned, country-parameterized source for a current-market layer, but requires an `app_id` and `app_key`; it therefore belongs behind a backend proxy with its source and refresh time visible to users, not in the static browser bundle. Source: <https://developer.adzuna.com/overview>.
