/**
 * Slippy-map tile arithmetic shared by the world map surfaces.
 *
 * Extracted from `WorldMapExplorer.tsx`, where these were module-private and
 * therefore untestable. Pure functions only — no DOM, no fetch — so they can be
 * unit tested directly.
 */

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** Web Mercator latitude limit; beyond this the projection diverges. */
export const MERCATOR_MAX_LATITUDE = 85.05112878;

export const longitudeToTileX = (longitude: number, zoom: number) =>
  clamp(Math.floor(((longitude + 180) / 360) * 2 ** zoom), 0, 2 ** zoom - 1);

export const latitudeToTileY = (latitude: number, zoom: number) => {
  const phi =
    (clamp(latitude, -MERCATOR_MAX_LATITUDE, MERCATOR_MAX_LATITUDE) * Math.PI) /
    180;
  const normalized =
    (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2;
  return clamp(Math.floor(normalized * 2 ** zoom), 0, 2 ** zoom - 1);
};

export type TileCoordinate = { z: number; x: number; y: number };

const numericPart = (part: string) => (part.trim() === "" ? NaN : Number(part));

/**
 * Parses a `"z/x/y"` tile key. Missing, blank, or non-numeric components come
 * back as `NaN`, which fails every range comparison — so a malformed key is
 * excluded rather than silently treated as tile 0. (`Number("")` is 0, which is
 * why the blank case needs an explicit guard.)
 */
export const tileKeyParts = (key: string): TileCoordinate => {
  const [z, x, y] = key.split("/").map(numericPart);
  return { z: z ?? NaN, x: x ?? NaN, y: y ?? NaN };
};

export type TileRange = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/** `[[west, south], [east, north]]`, matching MapLibre's `getBounds().toArray()`. */
export type LngLatBounds = [[number, number], [number, number]];

/**
 * The inclusive tile range covering `bounds` at `zoom`. Note the Y inversion:
 * tile Y grows southward, so the northern edge yields `minY`.
 */
export const tileRangeForViewport = (
  zoom: number,
  bounds: LngLatBounds | null
): TileRange | null => {
  if (!bounds) return null;
  const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = bounds;
  return {
    minX: longitudeToTileX(minLongitude, zoom),
    maxX: longitudeToTileX(maxLongitude, zoom),
    minY: latitudeToTileY(maxLatitude, zoom),
    maxY: latitudeToTileY(minLatitude, zoom),
  };
};

/** Every `"z/x/y"` key in the viewport range, whether or not the tile exists. */
export const tileKeysInViewport = (
  zoom: number,
  bounds: LngLatBounds | null
): string[] => {
  const range = tileRangeForViewport(zoom, bounds);
  if (!range) return [];
  const keys: string[] = [];
  for (let x = range.minX; x <= range.maxX; x += 1)
    for (let y = range.minY; y <= range.maxY; y += 1)
      keys.push(`${zoom}/${x}/${y}`);
  return keys;
};

/** The subset of an enumerated tile list that intersects the viewport. */
export const tileKeysForViewport = (
  layer: { tileZoom: number; tiles: string[] },
  bounds: LngLatBounds | null
): string[] => {
  const range = tileRangeForViewport(layer.tileZoom, bounds);
  if (!range) return [];
  return layer.tiles.filter(key => {
    const { x, y } = tileKeyParts(key);
    return (
      x >= range.minX && x <= range.maxX && y >= range.minY && y <= range.maxY
    );
  });
};
