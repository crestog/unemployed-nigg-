export type GlobalMvtLayer = {
  tileZoom: number;
  featureCount: number;
  invalidOrEmptyFeatures: number;
  tileCount: number;
  tileBytes: number;
  /**
   * Absent from the manifest the client downloads. It was an exhaustive
   * `"z/x/y.pbf"` enumeration — 459,493 keys, 8.27 MB of the 8.27 MB file — that
   * nothing read: MapLibre asks for tiles by URL template and treats a missing
   * one as empty. `scripts/build-world-manifest.mjs` strips it; the full listing
   * stays in the release-scoped manifest as the provenance record.
   */
  tiles?: string[];
  layerDirectory?: string;
  mvtSourceLayer?: string;
  labelOnly?: boolean;
  sourceFile: string;
  sourceSha256: string;
  sourceUrl: string;
  /**
   * One row per country, and stripped by the same script except on
   * `placesLabels`, where the first row is the GeoNames attribution shown on a
   * locality selection. Treat any other layer's as absent.
   */
  sourceMetadata?: Array<{
    countryCode?: string;
    countryName?: string;
    boundaryType?: string;
    boundaryYearRepresented?: string;
    sourceUrl?: string;
    sourceLicense?: string;
    licenseSource?: string;
    sourceHash?: string;
    sourceBytes?: number;
    featureCount?: number;
  }>;
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
    deepLevels?: Record<string, {
      tileZoom: number;
      sourceFile: string;
      sourceMetadataRecords: number;
      requestedFeatureCount?: number | null;
    }>;
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
    [key: string]: GlobalMvtLayer;
  };
};

export type GlobalMvtLayerKey = string;

const globalMvtDirectoryByKey: Record<string, string> = {
  adm1: "adm1",
  adm1Labels: "adm1-labels",
  adm2: "adm2",
  adm2Labels: "adm2-labels",
};

export const globalMvtDirectoryForKey = (layer: GlobalMvtLayerKey) =>
  globalMvtDirectoryByKey[layer] ?? (layer.endsWith("Labels")
    ? `${layer.slice(0, -"Labels".length)}-labels`
    : layer);

export const globalMvtTileUrl = (
  manifest: GlobalMvtManifest,
  layer: GlobalMvtLayerKey
) => manifest.tileTemplate
  .replace("{releaseId}", manifest.releaseId)
  .replace("{layer}", globalMvtDirectoryForKey(layer));
