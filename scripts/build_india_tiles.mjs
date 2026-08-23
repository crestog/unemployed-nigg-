import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "client", "public", "data", "world-india-geography.json");
const outputRoot = path.join(root, "client", "public", "data", "india-tiles");
const source = JSON.parse(await readFile(sourcePath, "utf8"));

const layerConfig = {
  adm1: { tileZoom: 4, tolerance: 0.02, source: source.layers.adm1 },
  adm2: { tileZoom: 6, tolerance: 0.008, source: source.layers.adm2 },
  localities: { tileZoom: 8, tolerance: 0, source: source.layers.localities },
};

const finite = value => Number.isFinite(value);
const coordinatePairs = geometry => {
  if (!geometry) return [];
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "MultiPoint" || geometry.type === "LineString") return geometry.coordinates;
  if (geometry.type === "MultiLineString" || geometry.type === "Polygon") return geometry.coordinates.flat();
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  if (geometry.type === "GeometryCollection") return geometry.geometries.flatMap(coordinatePairs);
  return [];
};
const geometryBounds = geometry => {
  const pairs = coordinatePairs(geometry).filter(pair => finite(pair?.[0]) && finite(pair?.[1]));
  if (!pairs.length) return null;
  return pairs.reduce((bounds, pair) => [
    Math.min(bounds[0], pair[0]),
    Math.min(bounds[1], pair[1]),
    Math.max(bounds[2], pair[0]),
    Math.max(bounds[3], pair[1]),
  ], [Infinity, Infinity, -Infinity, -Infinity]);
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const tileX = (longitude, z) => clamp(Math.floor(((longitude + 180) / 360) * 2 ** z), 0, 2 ** z - 1);
const tileY = (latitude, z) => {
  const phi = clamp(latitude, -85.05112878, 85.05112878) * Math.PI / 180;
  const normalized = (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2;
  return clamp(Math.floor(normalized * 2 ** z), 0, 2 ** z - 1);
};
const compactGeometry = (geometry, tolerance = 0) => {
  if (!geometry) return geometry;
  const roundPair = pair => pair.map(value => Number(Number(value).toFixed(5)));
  const pointDistance = (point, start, end) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    if (dx === 0 && dy === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);
    const t = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy);
    const projection = t < 0 ? start : t > 1 ? end : [start[0] + t * dx, start[1] + t * dy];
    return Math.hypot(point[0] - projection[0], point[1] - projection[1]);
  };
  const simplifyLine = points => {
    if (tolerance <= 0 || points.length < 4) return points;
    let maxDistance = tolerance;
    let index = -1;
    const start = points[0];
    const end = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i += 1) {
      const distance = pointDistance(points[i], start, end);
      if (distance > maxDistance) { index = i; maxDistance = distance; }
    }
    if (index < 0) return [start, end];
    const left = simplifyLine(points.slice(0, index + 1));
    const right = simplifyLine(points.slice(index));
    return left.slice(0, -1).concat(right);
  };
  const simplifyRing = ring => {
    const open = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
    const simplified = simplifyLine(open);
    const closed = simplified.length >= 3 ? [...simplified, simplified[0]] : ring;
    return closed.map(roundPair);
  };
  const mapCoordinates = coordinates => Array.isArray(coordinates) && typeof coordinates[0] === "number"
    ? roundPair(coordinates)
    : coordinates.map(mapCoordinates);
  const mapPolygon = polygon => polygon.map(simplifyRing);
  const nextCoordinates = geometry.type === "Polygon"
    ? geometry.coordinates.map(simplifyRing)
    : geometry.type === "MultiPolygon"
      ? geometry.coordinates.map(mapPolygon)
      : mapCoordinates(geometry.coordinates);
  return { ...geometry, coordinates: nextCoordinates };
};
const sha256 = value => createHash("sha256").update(value).digest("hex");
const tileMap = new Map();

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const [layer, config] of Object.entries(layerConfig)) {
  const z = config.tileZoom;
  const records = layer === "localities"
    ? config.source.records.map(record => ({ ...record, _bounds: [record.longitude, record.latitude, record.longitude, record.latitude] }))
    : config.source.features.map(feature => ({
        id: String(feature.id),
        name: feature.name,
        isoCode: feature.isoCode ?? null,
        geometry: compactGeometry(feature.geometry, config.tolerance),
        _bounds: geometryBounds(feature.geometry),
      }));
  const layerTiles = new Map();
  for (const record of records) {
    if (!record._bounds) continue;
    const [minLon, minLat, maxLon, maxLat] = record._bounds;
    const minX = tileX(minLon, z);
    const maxX = tileX(maxLon, z);
    const minY = tileY(maxLat, z);
    const maxY = tileY(minLat, z);
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        const key = `${z}/${x}/${y}`;
        const list = layerTiles.get(key) ?? [];
        const clean = { ...record };
        delete clean._bounds;
        list.push(clean);
        layerTiles.set(key, list);
      }
    }
  }
  const layerRoot = path.join(outputRoot, layer);
  await mkdir(layerRoot, { recursive: true });
  for (const [key, recordsForTile] of layerTiles) {
    const [tileLevel, x, y] = key.split("/");
    const payload = JSON.stringify({ releaseId: source.releaseId, layer, z: Number(tileLevel), x: Number(x), y: Number(y), records: recordsForTile });
    await writeFile(path.join(layerRoot, `${x}-${y}.json`), `${payload}\n`, "utf8");
  }
  tileMap.set(layer, {
    tileZoom: z,
    count: records.length,
    tileCount: layerTiles.size,
    tiles: [...layerTiles.keys()].sort(),
    label: config.source.label,
    source: config.source.source,
    precisionNotice: config.source.precisionNotice,
  });
}

const manifestPayload = JSON.stringify({
  format: "atlas-india-spatial-tiles-v1",
  releaseId: source.releaseId,
  generatedAt: new Date().toISOString(),
  jurisdiction: source.jurisdiction,
  sourceAsset: "/data/world-india-geography.json",
  coordinateSystem: "WGS84 longitude/latitude; geometry coordinates rounded to 5 decimals for display tiles",
  layers: Object.fromEntries(tileMap),
});
await writeFile(path.join(outputRoot, "manifest.json"), `${manifestPayload}\n`, "utf8");
console.log(JSON.stringify({
  outputRoot,
  releaseId: source.releaseId,
  manifestSha256: sha256(manifestPayload),
  layers: Object.fromEntries([...tileMap].map(([layer, meta]) => [layer, { count: meta.count, tileZoom: meta.tileZoom, tileCount: meta.tileCount }])),
}, null, 2));
