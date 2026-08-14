// Industry Niche Atlas style reminder: editorial cartography, warm mineral paper, ink typography, oxidized teal paths, coral signals, evidence beside interpretation.

export type AtlasNode = {
  id: string;
  label: string;
  type: string;
  code: string;
  description: string;
  count?: string;
  tone: "teal" | "coral" | "ochre" | "ink";
  level: number;
};

export const taxonomyStats = [
  { label: "GICS", value: "11 → 163", note: "sectors to sub-industries", accent: "teal" },
  { label: "NAICS", value: "20 sectors", note: "five official levels", accent: "ochre" },
  { label: "ISIC Rev. 5", value: "22 → 463", note: "sections to classes", accent: "coral" },
  { label: "O*NET 30.3", value: "1,016", note: "occupation titles", accent: "ink" },
];

export const nodes: AtlasNode[] = [
  { id: "information", label: "Information Technology", type: "GICS sector", code: "45", description: "Software, hardware, semiconductors, and IT services that move information through digital systems.", count: "1 of 11 sectors", tone: "teal", level: 1 },
  { id: "software", label: "Software & Services", type: "Industry group", code: "4510", description: "Companies building, operating, and supporting software products, platforms, and infrastructure.", count: "3 clusters", tone: "teal", level: 2 },
  { id: "data", label: "Data & Analytics", type: "Domain", code: "D-04", description: "The work of turning messy observations into trustworthy decisions, measurements, and operational signals.", count: "7 connected roles", tone: "coral", level: 3 },
  { id: "scientist", label: "Data Scientist", type: "O*NET occupation", code: "15-2051.00", description: "Develops and applies models, experiments, and analytical methods to extract insight from data.", count: "923 data-level occupations", tone: "ochre", level: 4 },
  { id: "clinical", label: "Clinical Data Quality Analyst", type: "Specialization", code: "N-021", description: "A narrow work niche at the intersection of clinical operations, data governance, and evidence quality.", count: "Prototype niche", tone: "coral", level: 5 },
];

export const taskRows = [
  { label: "Validate incoming records", day: 28, week: 18, month: 12, tone: "teal" },
  { label: "Investigate anomalies", day: 24, week: 22, month: 14, tone: "coral" },
  { label: "Document decisions", day: 18, week: 18, month: 20, tone: "ochre" },
  { label: "Coordinate with domain teams", day: 16, week: 21, month: 22, tone: "ink" },
  { label: "Improve checks and workflows", day: 14, week: 21, month: 32, tone: "teal" },
];

export const sources = [
  { name: "U.S. Census Bureau", item: "NAICS 2022 structure", kind: "Official classification", url: "https://www.census.gov/programs-surveys/economic-census/year/2022/guidance/understanding-naics.html" },
  { name: "UN Statistics Division", item: "ISIC Rev. 5", kind: "Global classification", url: "https://unstats.un.org/unsd/classifications/Family/Detail/2095" },
  { name: "O*NET Resource Center", item: "Tasks, work activities, context", kind: "Open occupational data", url: "https://www.onetcenter.org/database.html" },
  { name: "European Commission", item: "ESCO skills and semantic model", kind: "Open skills graph", url: "https://esco.ec.europa.eu/en/use-esco/download" },
  { name: "S&P DJI / MSCI", item: "GICS 4-tier framework", kind: "Global market lens", url: "https://www.spglobal.com/spdji/en/landing/topic/gics/" },
];

export const scatterPoints = [
  { x: 31, y: 76, size: 18, label: "Healthcare analytics", tone: "teal" },
  { x: 68, y: 88, size: 26, label: "Cloud infrastructure", tone: "coral" },
  { x: 52, y: 62, size: 14, label: "Clinical operations", tone: "ochre" },
  { x: 81, y: 56, size: 11, label: "Retail systems", tone: "ink" },
  { x: 42, y: 45, size: 20, label: "Data quality", tone: "teal" },
  { x: 22, y: 34, size: 10, label: "Legacy services", tone: "coral" },
];

export const wordCloud = [
  ["validation", 28], ["quality", 26], ["SQL", 23], ["clinical", 20], ["documentation", 18], ["anomaly", 16], ["governance", 15], ["Python", 14], ["stakeholders", 13], ["audit", 12], ["workflow", 11], ["privacy", 10],
] as const;

export const clusterItems = [
  { title: "Evidence & controls", items: ["validation", "audit", "governance"], tone: "teal" },
  { title: "Analysis & tooling", items: ["SQL", "Python", "anomaly detection"], tone: "coral" },
  { title: "Translation work", items: ["documentation", "stakeholders", "workflow"], tone: "ochre" },
];

