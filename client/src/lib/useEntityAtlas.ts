/**
 * State for the entity layer: one atlas fetch, one filter, one selection.
 *
 * This is a hook rather than state inside `WorldMapExplorer` because three consumers need the same
 * derived values and they are expensive to recompute: the map needs markers, the filter panel needs
 * per-facet counts, and the detail panel needs the records at the selected position. Everything here
 * is derived from two pieces of state — `filter` and `selected` — so there is no cache to invalidate.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ENTITY_FACETS,
  clusterEntities,
  entityLabel,
  facetCounts,
  loadEntityAtlas,
  loadEntityDetail,
  readEntityDetail,
  searchEntities,
  type EntityAtlas,
  type EntityCluster,
  type EntityDetail,
  type EntityFacet,
  type EntityFilter,
} from "./entityAtlas";

export type EntityMarkerRecord = {
  id: string;
  longitude: number;
  latitude: number;
  count: number;
  weight: number;
  precision: number;
  /** The record's own name when a position holds one record, else the place every record shares. */
  label: string;
  selected: boolean;
};

export type EntityRow = {
  record: number;
  name: string;
  type: string;
  sector: string;
  place: string;
  precision: number;
};

/** `sqrt(count)`, so marker *area* reads as the count, clamped so one position cannot swamp the map. */
const markerWeight = (count: number) => Math.min(9, Math.max(1, Math.sqrt(count)));

export function useEntityAtlas(enabled: boolean) {
  const [atlas, setAtlas] = useState<EntityAtlas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<EntityFilter>({});
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<Record<number, EntityDetail>>({});
  // Which records have been asked for. A set of requests rather than a mirror of `detail`, because a
  // ref written during render is read before React has committed the value it is mirroring — and it
  // also collapses two clicks on one record into one fetch.
  const requested = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled || atlas) return;
    const controller = new AbortController();
    setLoading(true);
    loadEntityAtlas(controller.signal)
      .then(loaded => {
        setAtlas(loaded);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("atlas: entity layer failed to load", cause);
        setError("The startup-ecosystem layer could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [atlas, enabled]);

  const clusters = useMemo(
    () => (atlas ? clusterEntities(atlas, filter) : []),
    [atlas, filter]
  );

  const markers = useMemo<EntityMarkerRecord[]>(
    () =>
      clusters.map(cluster => ({
        id: String(cluster.position),
        longitude: cluster.lng,
        latitude: cluster.lat,
        count: cluster.count,
        weight: markerWeight(cluster.count),
        precision: cluster.precision,
        // A bare count is unreadable on a map: "539" hovering over southern India names nothing a
        // reader can act on. Every record sharing an interned position also shares one `place` index
        // — verified across all 366 positions, 0 of which hold two — so the place name is the honest
        // label for an aggregate, and the count qualifies it rather than replacing it. A position
        // holding a single record is labelled by that record, which is the most specific truth there.
        label: !atlas
          ? ""
          : cluster.count === 1
            ? (atlas.names[cluster.records[0]!] ?? "")
            : (entityLabel(atlas, "place", cluster.records[0]!) ||
              (atlas.names[cluster.records[0]!] ?? "")),
        selected: cluster.position === selected,
      })),
    [atlas, clusters, selected]
  );

  /** Total records matching the filter — the sum of the untruncated counts, not of the record lists. */
  const matched = useMemo(
    () => clusters.reduce((sum, cluster) => sum + cluster.count, 0),
    [clusters]
  );

  const selectedCluster = useMemo<EntityCluster | null>(
    () => (selected === null ? null : clusters.find(item => item.position === selected) ?? null),
    [clusters, selected]
  );

  const selectedRows = useMemo<EntityRow[]>(() => {
    if (!atlas || !selectedCluster) return [];
    return selectedCluster.records.map(record => ({
      record,
      name: atlas.names[record] ?? "",
      type: entityLabel(atlas, "type", record),
      sector: entityLabel(atlas, "sector", record),
      place: entityLabel(atlas, "place", record),
      precision: atlas.precisionOf[record] ?? 0,
    }));
  }, [atlas, selectedCluster]);

  const facets = useMemo(() => {
    if (!atlas) return [];
    return ENTITY_FACETS.map(facet => ({
      facet,
      values: facetCounts(atlas, facet, filter),
      chosen: filter[facet] ?? null,
    })).filter(item => item.values.length > 1);
  }, [atlas, filter]);

  const results = useMemo(() => {
    if (!atlas || query.trim().length < 2) return [];
    return searchEntities(atlas, query, 20).map(record => ({
      record,
      name: atlas.names[record] ?? "",
      place: entityLabel(atlas, "place", record),
      position: atlas.positionOf[record] ?? -1,
    }));
  }, [atlas, query]);

  const toggleFacet = useCallback((facet: EntityFacet, value: number) => {
    setFilter(current => {
      const chosen = new Set(current[facet] ?? []);
      if (chosen.has(value)) chosen.delete(value);
      else chosen.add(value);
      const next = { ...current };
      // Delete rather than keep an empty Set: `clusterEntities` treats an empty set as "no
      // constraint" anyway, and carrying it would make the filter look active in the UI.
      if (chosen.size) next[facet] = chosen;
      else delete next[facet];
      return next;
    });
  }, []);

  const clearFilter = useCallback(() => setFilter({}), []);

  /**
   * Prose and links live in a second file the map never reads, fetched on first selection only.
   * Resolved details are kept per record: reselecting a position must not refetch 6 MB.
   */
  const requestDetail = useCallback((record: number) => {
    if (requested.current.has(record)) return;
    requested.current.add(record);
    loadEntityDetail()
      .then(raw => {
        setDetail(current =>
          current[record] ? current : { ...current, [record]: readEntityDetail(raw, record) }
        );
      })
      .catch((cause: unknown) => {
        // Forget it, so clicking the record again retries rather than staying blank for the session.
        requested.current.delete(record);
        console.error("atlas: entity detail failed to load", cause);
      });
  }, []);

  return {
    atlas,
    loading,
    error,
    filter,
    facets,
    toggleFacet,
    clearFilter,
    query,
    setQuery,
    results,
    markers,
    matched,
    selected,
    setSelected,
    selectedCluster,
    selectedRows,
    detail,
    requestDetail,
  };
}

export type EntityAtlasState = ReturnType<typeof useEntityAtlas>;
