import { describe, expect, it } from "vitest";

import { rowWindow } from "../../client/src/lib/rowWindow";

/** The real grid: 44 px rows, a ~620 px viewport, 6 rows of overscan, 13,321 records. */
const at = (over: Partial<Parameters<typeof rowWindow>[0]> = {}) =>
  rowWindow({ total: 13321, rowHeight: 44, scrollTop: 0, viewportHeight: 616, overscan: 6, ...over });

describe("row window", () => {
  it("renders a viewport's worth of rows plus overscan, not 13,321 of them", () => {
    // 616 / 44 = 14 visible. The whole point: a DOM of ~20 rows for a corpus of 13,321.
    expect(at()).toEqual({ start: 0, end: 20, totalHeight: 586124 });
    expect(at({ scrollTop: 4400 })).toEqual({ start: 94, end: 120, totalHeight: 586124 });
  });

  it("keeps rows rendered when the list is scrolled to the very end", () => {
    const window = at({ scrollTop: 586124 - 616 });
    expect(window.end).toBe(13321);
    expect(window.start).toBe(13301);
  });

  it("recovers when a filter shortens the list under a stale scroll offset", () => {
    // Type two characters into search while scrolled to row 9,000: `scrollTop` is still 396,000 for
    // a list that is now 3 rows long. Deriving the window from it unclamped renders rows
    // 9000…9020 — none of which exist — so a query with three matches reads as no matches.
    const window = at({ total: 3, scrollTop: 396000 });
    expect(window).toEqual({ start: 0, end: 3, totalHeight: 132 });
  });

  it("renders something before the container has been measured", () => {
    expect(at({ viewportHeight: 0, overscan: 0 })).toMatchObject({ start: 0, end: 1 });
  });

  it("is empty only when the list is", () => {
    expect(at({ total: 0 })).toEqual({ start: 0, end: 0, totalHeight: 0 });
  });

  it("pins the keyboard cursor into the window so `aria-activedescendant` can resolve", () => {
    // Arrow-down to row 400, then scroll back to the top with the wheel: without this the active
    // row unmounts and the grid points its `aria-activedescendant` at an id that is not in the DOM,
    // which screen readers report as no selection at all.
    const window = at({ include: 400 });
    expect(window.start).toBe(0);
    expect(window.end).toBe(401);
    // Above the window it extends the other way, and it never reaches outside the list.
    expect(at({ scrollTop: 44000, include: 3 }).start).toBe(3);
    expect(at({ include: 99999 })).toEqual(at());
    expect(at({ include: -1 })).toEqual(at());
  });

  it("clamps a negative scroll offset, which is what an overscroll bounce reports", () => {
    expect(at({ scrollTop: -180 })).toEqual(at({ scrollTop: 0 }));
  });
});
