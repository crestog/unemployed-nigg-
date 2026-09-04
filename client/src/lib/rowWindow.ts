/**
 * Which rows a fixed-height list must render at a given scroll offset.
 *
 * Kept as a pure function, separate from the hook that feeds it, because every interesting case here
 * is arithmetic rather than DOM: a stale `scrollTop` after a filter, a viewport not yet measured, a
 * keyboard cursor scrolled out of view. Those are the cases that empty the list on screen, and they
 * are only cheap to assert while none of this needs a browser.
 */

export type RowWindowInput = {
  total: number;
  rowHeight: number;
  scrollTop: number;
  viewportHeight: number;
  /** Rows to render beyond the viewport on each side, so a fast scroll does not show blank bands. */
  overscan?: number;
  /**
   * A row that must be rendered even when it is scrolled out of view. The grid's
   * `aria-activedescendant` has to name an element that exists, so the keyboard cursor is pinned
   * into the window rather than being allowed to unmount.
   */
  include?: number;
};

/** `end` is exclusive. `totalHeight` is the spacer the rows are absolutely positioned inside. */
export type RowWindow = { start: number; end: number; totalHeight: number };

export function rowWindow(input: RowWindowInput): RowWindow {
  const rowHeight = Math.max(1, input.rowHeight);
  const total = Math.max(0, Math.floor(input.total));
  const totalHeight = total * rowHeight;
  if (total === 0) return { start: 0, end: 0, totalHeight: 0 };
  const overscan = Math.max(0, Math.floor(input.overscan ?? 0));
  // At least one row: on the first paint the container has not been measured yet, and rendering
  // nothing until a ResizeObserver fires shows an empty list for a frame.
  const visible = Math.max(1, Math.ceil(Math.max(0, input.viewportHeight) / rowHeight));
  // Clamp the first row to the last full screen. Narrowing 13,321 rows to 3 leaves `scrollTop` at
  // whatever it was until the browser reflows, and an unclamped `floor(scrollTop / rowHeight)` puts
  // the window past the end of the list — which renders as "no results" for a query that has some.
  const maxStart = Math.max(0, total - visible);
  const first = Math.min(maxStart, Math.max(0, Math.floor(Math.max(0, input.scrollTop) / rowHeight)));
  let start = Math.max(0, first - overscan);
  let end = Math.min(total, first + visible + overscan);
  const include = input.include;
  if (include !== undefined && include >= 0 && include < total) {
    start = Math.min(start, include);
    end = Math.max(end, include + 1);
  }
  return { start, end, totalHeight };
}
