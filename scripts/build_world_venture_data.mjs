import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import isoCountries from "i18n-iso-countries";
import topology from "world-atlas/countries-50m.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(root, "client", "public", "data", "world-venture.json");
const indiaGeographyOutputPath = path.join(root, "client", "public", "data", "world-india-geography.json");
const worldRawPath = path.join(root, "data", "raw", "world");
const requestedAt = new Date().toISOString();
const sourceBase = "https://api.gleif.org/api/v1/lei-records";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const topologyCountryCodes = [...new Set(topology.objects.countries.geometries
  .map((geometry) => isoCountries.numericToAlpha2(String(geometry.id).padStart(3, "0")))
  .filter(Boolean))].sort();

async function fetchAggregate(countryCode) {
  const url = `${sourceBase}?filter%5Bentity.legalAddress.country%5D=${encodeURIComponent(countryCode)}&page%5Bsize%5D=1`;
  try {
    const response = await fetch(url, { headers: { accept: "application/vnd.api+json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    return {
      countryCode,
      countryName: isoCountries.getName(countryCode, "en") ?? countryCode,
      topologyId: String(isoCountries.alpha2ToNumeric(countryCode)).padStart(3, "0"),
      total: Number(body.meta?.pagination?.total ?? 0),
      goldenCopyPublishedAt: body.meta?.goldenCopy?.publishDate ?? null,
      sourceQuery: url,
      sourceStatus: "available",
    };
  } catch (error) {
    return {
      countryCode,
      countryName: isoCountries.getName(countryCode, "en") ?? countryCode,
      topologyId: String(isoCountries.alpha2ToNumeric(countryCode)).padStart(3, "0"),
      total: null,
      goldenCopyPublishedAt: null,
      sourceQuery: url,
      sourceStatus: "unavailable",
      error: error instanceof Error ? error.message : "Unknown request failure",
    };
  }
}

const readJson = async (fileName) => JSON.parse(await readFile(path.join(worldRawPath, fileName), "utf8"));

function sourceFromBoundaryMetadata(metadata) {
  return {
    publisher: "geoBoundaries / William & Mary geoLab",
    releaseType: "gbOpen",
    boundaryId: metadata.boundaryID,
    boundaryType: metadata.boundaryType,
    representedYear: metadata.boundaryYearRepresented,
    buildDate: metadata.buildDate,
    sourceDataUpdateDate: metadata.sourceDataUpdateDate,
    originalPublisher: metadata.boundarySource,
    license: metadata.boundaryLicense,
    licenseSource: metadata.licenseSource,
    sourceUrl: metadata.gjDownloadURL,
    unitCount: Number(metadata.admUnitCount),
  };
}

function normalizeBoundaryFeatures(collection) {
  return collection.features.map((featureItem) => ({
    id: featureItem.properties?.shapeID,
    name: featureItem.properties?.shapeName ?? "Unnamed administrative unit",
    isoCode: featureItem.properties?.shapeISO || null,
    geometry: featureItem.geometry,
  }));
}

function readIndiaLocalities(zipPath) {
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntries().find((item) => item.entryName.endsWith("IN.txt"));
  if (!entry) throw new Error("GeoNames India archive does not contain its text extract.");
  const seen = new Set();
  return entry.getData().toString("utf8").split("\n").flatMap((line) => {
    const columns = line.split("\t");
    const featureClass = columns[6];
    const featureCode = columns[7] ?? "";
    const population = Number(columns[14] ?? 0);
    const isAdministrativeSeat = /^PPLA|^PPLC/.test(featureCode);
    if (featureClass !== "P" || (population < 5000 && !isAdministrativeSeat) || seen.has(columns[0])) return [];
    seen.add(columns[0]);
    return [{
      id: columns[0],
      name: columns[1],
      asciiName: columns[2] || columns[1],
      latitude: Number(columns[4]),
      longitude: Number(columns[5]),
      featureCode,
      admin1Code: columns[10] || null,
      admin2Code: columns[11] || null,
      population,
      modificationDate: columns[18] || null,
    }];
  }).filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

const aggregates = [];
for (const countryCode of topologyCountryCodes) {
  aggregates.push(await fetchAggregate(countryCode));
  await delay(80);
}

const available = aggregates.filter((record) => record.sourceStatus === "available");
const unavailable = aggregates.filter((record) => record.sourceStatus === "unavailable");
const [indiaAdm1Metadata, indiaAdm2Metadata, indiaAdm1, indiaAdm2] = await Promise.all([
  readJson("geoboundaries-ind-adm1-meta.json"),
  readJson("geoboundaries-ind-adm2-meta.json"),
  readJson("geoboundaries-ind-adm1.geojson"),
  readJson("geoboundaries-ind-adm2.geojson"),
]);
const indiaLocalities = readIndiaLocalities(path.join(worldRawPath, "geonames-india.zip"));

const release = {
  releaseId: `world-venture-${requestedAt.slice(0, 10).replaceAll("-", "")}`,
  generatedAt: requestedAt,
  integrity: {
    syntheticRecords: 0,
    sourceCountryGeometryCount: topologyCountryCodes.length,
    availableCountryQueries: available.length,
    unavailableCountryQueries: unavailable.length,
  },
  geography: {
    publisher: "Natural Earth",
    title: "Admin 0 countries, 50m topology distributed by world-atlas",
    license: "Public domain",
    sourceUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
    use: "Map geometry only; does not assert entity locations or political status.",
  },
  layers: {
    legalEntities: {
      id: "gleif-lei-legal-address-country",
      label: "Legal entities with LEIs",
      publisher: "Global Legal Entity Identifier Foundation (GLEIF)",
      sourceUrl: "https://www.gleif.org/en/lei-data/access-and-use-lei-data",
      termsUrl: "https://www.gleif.org/en/meta/lei-data-terms-of-use",
      license: "CC0 via GLEIF Access Service",
      recordDefinition: "GLEIF Legal Entity Identifier reference records grouped by the record's legal-address country.",
      exclusions: [
        "Not all legal entities have LEIs.",
        "Not a census of businesses, startups, or operating organizations.",
        "Legal-address country is not a headquarters or operating-location claim.",
      ],
      records: aggregates,
    },
    policyInitiatives: {
      id: "ec-oecd-stip-compass",
      label: "Innovation-policy initiatives",
      publisher: "European Commission and OECD",
      sourceUrl: "https://stip.oecd.org/stip/download-data",
      status: "source_handoff_pending_snapshot",
      recordDefinition: "STIP Compass policy initiatives and associated instruments, source edition required.",
      exclusions: [
        "No policy counts are emitted until a complete official release is acquired and normalized.",
        "Not a complete policy census, legal advice, or eligibility determination.",
      ],
    },
  },
};

const indiaGeographyRelease = {
  releaseId: `world-india-geography-${requestedAt.slice(0, 10).replaceAll("-", "")}`,
  generatedAt: requestedAt,
  jurisdiction: { isoAlpha2: "IN", isoAlpha3: "IND", label: "India" },
  layers: {
    adm1: {
      label: "States and Union Territories",
      source: sourceFromBoundaryMetadata(indiaAdm1Metadata),
      features: normalizeBoundaryFeatures(indiaAdm1),
      precisionNotice: "Administrative reference geometry. It is not evidence that a legal entity, business, startup, or policy occurs in an administrative unit.",
    },
    adm2: {
      label: "Districts",
      source: sourceFromBoundaryMetadata(indiaAdm2Metadata),
      features: normalizeBoundaryFeatures(indiaAdm2),
      precisionNotice: "Administrative reference geometry. District boundaries are a distinct source release from ADM1 and must not be treated as a live national register.",
    },
    localities: {
      label: "Cities and towns reference",
      source: {
        publisher: "GeoNames",
        sourceUrl: "https://download.geonames.org/export/dump/IN.zip",
        termsUrl: "https://www.geonames.org/export/",
        license: "CC BY with required GeoNames credit",
        extract: "India country extract; populated places with population at least 5,000 plus administrative seats",
        sourceFile: "IN.zip",
      },
      records: indiaLocalities,
      precisionNotice: "Place-name reference points from GeoNames. They do not evidence any organization location, startup activity, or administrative authority.",
    },
  },
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(release)}\n`, "utf8");
await writeFile(indiaGeographyOutputPath, `${JSON.stringify(indiaGeographyRelease)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  indiaGeographyOutputPath,
  totalCountries: aggregates.length,
  availableCountries: available.length,
  countriesWithLeiRecords: available.filter((record) => (record.total ?? 0) > 0).length,
  unavailableCountries: unavailable.length,
  goldenCopyDates: [...new Set(available.map((record) => record.goldenCopyPublishedAt).filter(Boolean))],
  indiaAdm1Features: indiaGeographyRelease.layers.adm1.features.length,
  indiaAdm2Features: indiaGeographyRelease.layers.adm2.features.length,
  indiaLocalityReferences: indiaGeographyRelease.layers.localities.records.length,
}, null, 2));
