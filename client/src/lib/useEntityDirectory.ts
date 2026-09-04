/**
 * State for the directory page: one atlas fetch, one query, one selected record.
 *
 * The query is React state rather than being read straight from the URL on every render, and the URL
 * is written from it on a delay. Both halves of that are deliberate. Typing into an input whose value
 * comes back from `history.replaceState` puts a navigation on every keystroke, which browsers rate
 * limit — Safari at 100 calls per 30 seconds — and a throttled keystroke is a dropped character. And
 * facet values serialise by *label*, which cannot be written until the dictionaries have loaded, so
 * writing eagerly would publish a URL with the filters stripped out of it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "wouter";

import {
  ENTITY_FACETS,
  loadEntityAtlas,
  loadEntityDetail,
  readEntityDetail,
  type EntityAtlas,
  type EntityDetail,
  type EntityFacet,
} from "./entityAtlas";
import {
  EMPTY_QUERY,
  directoryFacetCounts,
  directoryQueryFromParams,
  directoryQueryToParams,
  directoryRowCount,
  pivotFilter,
  rowRecord,
  rowRelationships,
  rowScope,
  selectDirectoryRows,
  toggleFacetValue,
  type DirectoryQuery,
  type DirectoryScope,
  type DirectorySort,
} from "./entityDirectory";

/** Long enough that a typed word is one navigation, short enough to be shareable on a pause. */
const URL_DELAY_MS = 300;

export function useEntityDirectory() {
  const [params, setParams] = useSearchParams();
  const [atlas, setAtlas] = useState<EntityAtlas | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Restored from the URL before the 1.3 MB payload lands, so the toolbar is not blank on first
  // paint. Facets resolve in the effect below, once there are dictionaries to resolve labels against.
  const [query, setQuery] = useState<DirectoryQuery>(() => directoryQueryFromParams(null, params));
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<Record<number, EntityDetail>>({});
  const [detailPending, setDetailPending] = useState(false);
  // Which rows have been asked for, so re-selecting a row does not re-request it. A set of requests
  // rather than a mirror of `detail`: it is also what stops two clicks on one row racing, and it is
  // only ever touched from a click handler, never during render.
  const requested = useRef<Set<number>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    loadEntityAtlas(controller.signal)
      .then(loaded => {
        setAtlas(loaded);
        setError(null);
        // Facet values in the URL are labels, and labels need dictionaries, so this is the first
        // moment the filter in a shared link can be resolved at all. Done here rather than in an
        // effect watching `atlas` so the atlas and its restored filter land in one commit.
        const restored = directoryQueryFromParams(
          loaded,
          new URLSearchParams(window.location.search)
        );
        if (Object.keys(restored.filter).length)
          setQuery(current => ({ ...current, filter: restored.filter }));
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("directory: entity atlas failed to load", cause);
        setError("The ecosystem records could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  const written = useRef(params.toString());
  useEffect(() => {
    if (!atlas) return;
    const next = directoryQueryToParams(atlas, query).toString();
    if (next === written.current) return;
    const timer = window.setTimeout(() => {
      written.current = next;
      setParams(next, { replace: true });
    }, URL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [atlas, query, setParams]);

  const selection = useMemo(
    () => (atlas ? selectDirectoryRows(atlas, query) : null),
    [atlas, query]
  );

  /** Every facet with more than one value left, so the rail never offers a choice of one. */
  const facetGroups = useMemo(
    () =>
      !atlas
        ? []
        : ENTITY_FACETS.map(facet => ({
            facet,
            values: directoryFacetCounts(atlas, facet, query),
            chosen: query.filter[facet] ?? null,
          })).filter(group => group.values.length > 1 || group.chosen?.size),
    [atlas, query]
  );

  const relationships = useMemo(
    () => (atlas && selected !== null ? rowRelationships(atlas, selected) : []),
    [atlas, selected]
  );

  const setText = useCallback((text: string) => setQuery(current => ({ ...current, text })), []);
  const setScope = useCallback(
    (scope: DirectoryScope) => setQuery(current => ({ ...current, scope })),
    []
  );
  /** Re-picking the current column flips it; a new column starts ascending, which is not surprising. */
  const setSort = useCallback(
    (sort: DirectorySort) =>
      setQuery(current =>
        current.sort === sort
          ? { ...current, descending: !current.descending }
          : { ...current, sort, descending: false }
      ),
    []
  );
  const toggleFacet = useCallback(
    (facet: EntityFacet, value: number) =>
      setQuery(current => ({ ...current, filter: toggleFacetValue(current.filter, facet, value) })),
    []
  );
  const clearFacet = useCallback(
    (facet: EntityFacet) =>
      setQuery(current => {
        const filter = { ...current.filter };
        delete filter[facet];
        return { ...current, filter };
      }),
    []
  );
  const clearFilter = useCallback(() => setQuery(current => ({ ...current, filter: {} })), []);
  const clearAll = useCallback(
    () => setQuery(current => ({ ...EMPTY_QUERY, scope: current.scope, sort: current.sort, descending: current.descending })),
    []
  );
  /**
   * A relationship pivot answers a new question — "everything sharing this host" — so it replaces the
   * filter outright and drops the text search. The sort and scope are how the reader is looking, not
   * what they asked, so those stay.
   */
  const pivot = useCallback(
    (facet: EntityFacet, value: number) =>
      setQuery(current => ({ ...current, text: "", filter: pivotFilter(facet, value) })),
    []
  );

  /** Prose and links live in a 6.3 MB second file the list never needs; fetched on first selection. */
  const requestDetail = useCallback(
    (row: number) => {
      if (!atlas || requested.current.has(row)) return;
      requested.current.add(row);
      setDetailPending(true);
      loadEntityDetail()
        .then(raw => {
          setDetail(current =>
            current[row]
              ? current
              : { ...current, [row]: readEntityDetail(raw, rowRecord(atlas, row), rowScope(atlas, row)) }
          );
        })
        .catch((cause: unknown) => {
          // Forget the request so re-selecting the record tries again: a dropped connection should
          // not make one row permanently prose-less for the rest of the session.
          requested.current.delete(row);
          console.error("directory: entity detail failed to load", cause);
        })
        .finally(() => setDetailPending(false));
    },
    [atlas]
  );

  const select = useCallback(
    (row: number | null) => {
      setSelected(row);
      if (row !== null) requestDetail(row);
    },
    [requestDetail]
  );

  return {
    atlas,
    error,
    query,
    selection,
    total: atlas ? directoryRowCount(atlas) : 0,
    facetGroups,
    relationships,
    selected,
    select,
    detail,
    detailPending,
    setText,
    setScope,
    setSort,
    toggleFacet,
    clearFacet,
    clearFilter,
    clearAll,
    pivot,
  };
}

export type EntityDirectoryState = ReturnType<typeof useEntityDirectory>;
