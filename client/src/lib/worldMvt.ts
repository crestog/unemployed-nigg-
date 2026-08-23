export type GlobalMvtLayer = {
  tileZoom: number;
  featureCount: number;
  invalidOrEmptyFeatures: number;
  tileCount: number;
  tileBytes: number;
  tiles: string[];
  sourceFile: string;
  sourceSha256: string;
  sourceUrl: string;
};

export type GlobalMvtManifest = {
  format: "atlas-global-geoboundaries-mvt-v1";
  releaseId: string;
  generatedAt: string;
  coordinateSystem: string;
  tileTemplate: string;
  coveragePolicy: {
    adm1: string;
    adm2: string;
    disputedAreas: string;
    syntheticFeatures: number;
  };
  source: {
    publisher: string;
    dataset: string;
    license: string;
    sourceUrl: string;
  };
  layers: {
    adm1: GlobalMvtLayer;
    adm2: GlobalMvtLayer;
  };
};

export const globalMvtTileUrl = (
  manifest: GlobalMvtManifest,
  layer: "adm1" | "adm2"
) => manifest.tileTemplate
  .replace("{releaseId}", manifest.releaseId)
  .replace("{layer}", layer);
