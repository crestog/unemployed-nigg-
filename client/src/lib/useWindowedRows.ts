/**
 * Windowing for the directory grid, hand-rolled because the project has no virtualisation
 * dependency and this needs about forty lines.
 *
 * Two details are what keep a 13,321-row list at one render per scrolled row rather than one per
 * scroll event. The scroll offset is quantised to a row bucket before it reaches state, so a wheel
 * gesture inside one row is not a re-render at all; and the container is held in state rather than a
 * ref, so the measuring effect can actually depend on it — a `ref.current` read in an effect body
 * silently misses the node on the first commit.
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import { rowWindow, type RowWindow } from "./rowWindow";

export type WindowedRows = RowWindow & {
  /** Attach to the scroll container. A callback ref, so a remount re-measures. */
  setContainer: (node: HTMLElement | null) => void;
  /** Bring a row fully into view with the smallest scroll that does it. */
  scrollToRow: (row: number) => void;
};

export function useWindowedRows(
  total: number,
  rowHeight: number,
  overscan = 6,
  include?: number
): WindowedRows {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [view, setView] = useState({ first: 0, rows: 0 });
  // The same node, twice, for two different jobs: the state copy is what the measuring effect
  // depends on, and this one is what imperative scrolling writes through — reading and driving a
  // DOM node is not React state work, and treating it as such is what the immutability rule warns
  // about. Written from the callback ref, so both are set in the same commit.
  const node = useRef<HTMLElement | null>(null);
  const attach = useCallback((element: HTMLElement | null) => {
    node.current = element;
    setContainer(element);
  }, []);

  useLayoutEffect(() => {
    if (!container) return;
    const read = () => {
      const first = Math.max(0, Math.floor(container.scrollTop / rowHeight));
      const rows = Math.max(1, Math.ceil(container.clientHeight / rowHeight));
      // Returning the same object is what makes React bail out: scrolling within a row, and any
      // resize that does not change how many rows fit, must not re-render the grid.
      setView(current => (current.first === first && current.rows === rows ? current : { first, rows }));
    };
    read();
    container.addEventListener("scroll", read, { passive: true });
    const observer = new ResizeObserver(read);
    observer.observe(container);
    return () => {
      container.removeEventListener("scroll", read);
      observer.disconnect();
    };
  }, [container, rowHeight]);

  const scrollToRow = useCallback(
    (row: number) => {
      const element = node.current;
      if (!element) return;
      const top = row * rowHeight;
      if (top < element.scrollTop) element.scrollTop = top;
      else if (top + rowHeight > element.scrollTop + element.clientHeight)
        element.scrollTop = top + rowHeight - element.clientHeight;
    },
    [rowHeight]
  );

  const window = useMemo(
    () =>
      rowWindow({
        total,
        rowHeight,
        scrollTop: view.first * rowHeight,
        viewportHeight: view.rows * rowHeight,
        overscan,
        include,
      }),
    [include, overscan, rowHeight, total, view.first, view.rows]
  );

  return { ...window, setContainer: attach, scrollToRow };
}
