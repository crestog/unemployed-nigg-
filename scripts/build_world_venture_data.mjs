import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import isoCountries from "i18n-iso-countries";
import topology from "world-atlas/countries-110m.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(root, "client", "public", "data", "world-venture.json");
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

const aggregates = [];
for (const countryCode of topologyCountryCodes) {
  aggregates.push(await fetchAggregate(countryCode));
  await delay(80);
}

const available = aggregates.filter((record) => record.sourceStatus === "available");
const unavailable = aggregates.filter((record) => record.sourceStatus === "unavailable");
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
    title: "Admin 0 countries, 110m topology distributed by world-atlas",
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

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(release)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  totalCountries: aggregates.length,
  availableCountries: available.length,
  countriesWithLeiRecords: available.filter((record) => (record.total ?? 0) > 0).length,
  unavailableCountries: unavailable.length,
  goldenCopyDates: [...new Set(available.map((record) => record.goldenCopyPublishedAt).filter(Boolean))],
}, null, 2));
