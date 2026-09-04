/**
 * Human wording for the atlas's coded columns, shared by the map overlay and the directory.
 *
 * These were private to `EntityAtlasPanel`. They are here because both views must name a facet and a
 * precision identically — a record filed under "Host institute" on the map and "host" in the list
 * reads as two different fields, and a coordinate described as a "state centroid" in one place and a
 * "point" in the other is a claim about accuracy, not a label.
 */

import type { EntityFacet } from "./entityAtlas";

/** Mirrors `PRECISIONS` in `scripts/build_entity_atlas.mjs`, in plain words. */
export const PRECISION_TEXT = [
  "city coordinate",
  "district centroid",
  "state centroid",
  "pan-India",
  "unplaced",
];

export const PRECISION_COLOR = ["#45d7c0", "#ffbf69", "#f2825b", "#9db2c8", "#526b84"];

/** Readable on paper rather than on the map's dark panel: same order, print-weight ink. */
export const PRECISION_INK = ["#0f766e", "#a5652a", "#c75b4a", "#8492ad", "#77766d"];

export const FACET_TITLE: Record<EntityFacet, string> = {
  type: "Type",
  owner: "Owner",
  sector: "Sector",
  stage: "Stage",
  support: "Support",
  state: "State",
  place: "Place",
  status: "Status",
  host: "Host institute",
  incubatorType: "Incubator type",
};
