export type GlobalMvtLayer = {
  tileZoom: number;
  featureCount: number;
  invalidOrEmptyFeatures: number;
  tileCount: number;
  tileBytes: number;
  tiles: string[];
  layerDirectory?: string;
  mvtSourceLayer?: string;
  labelOnly?: boolean;
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
  geometryPolicy?: {
    antimeridian: string;
    safeVectorLatitude: number;
    polarDetail: string;
    tileBufferPixels: number;
    worldSpanningFeatures: string;
  };
  coveragePolicy: {
    adm1: string;
    adm2: string;
    disputedAreas: string;
    syntheticFeatures: number;
  };
  geometryAudits?: Record<string, {
    json: string;
    csv: string;
    sourceFeatureCount: number;
    acceptedFeatureCount: number;
    rejectedFeatureCount: number;
    rejectedReasons: Record<string, number>;
  }>;
  source: {
    publisher: string;
    dataset: string;
    license: string;
    sourceUrl: string;
  };
  layers: {
    adm1: GlobalMvtLayer;
    adm1Labels: GlobalMvtLayer;
    adm2: GlobalMvtLayer;
    adm2Labels: GlobalMvtLayer;
  };
};

export type GlobalMvtLayerKey = keyof GlobalMvtManifest["layers"];

const globalMvtDirectoryByKey: Record<GlobalMvtLayerKey, string> = {
  adm1: "adm1",
  adm1Labels: "adm1-labels",
  adm2: "adm2",
  adm2Labels: "adm2-labels",
};

export const globalMvtTileUrl = (
  manifest: GlobalMvtManifest,
  layer: GlobalMvtLayerKey
) => manifest.tileTemplate
  .replace("{releaseId}", manifest.releaseId)
  .replace("{layer}", globalMvtDirectoryByKey[layer]);
