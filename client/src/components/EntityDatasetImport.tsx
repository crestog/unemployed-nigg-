import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, FileUp, ShieldCheck, X } from "lucide-react";

/** Editorial Cartography reminder: validate user-held records locally, and expose their provenance before any temporary map pin is drawn. */

export type ImportedEntity = {
  id: string; name: string; sourceRecordId: string; publisher: string; sourceUrl: string;
  acquisitionMethod: string; accessTimestamp: string; reuseStatus: string; entityCategory: string;
  activityStatusBasis: string; countryCode: string; admin1: string; admin2: string; locality: string;
  latitude: number | null; longitude: number | null; coordinateSource: string; coordinatePrecision: string;
  disposition: "pin" | "aggregate" | "blocked"; issues: string[];
};

type RawRow = Record<string, unknown>;
type Props = { onEntitiesChange: (entities: ImportedEntity[]) => void };

const MAX_ROWS = 60_000;
const aliases: Record<string, string[]> = {
  name: ["name", "company_name", "startup_name", "entity_name", "organization_name"],
  sourceRecordId: ["source_record_id", "record_id", "id", "uuid", "company_id"],
  publisher: ["publisher", "source_publisher", "directory", "source_name"],
  sourceUrl: ["source_url", "url", "record_url", "profile_url", "website"],
  acquisitionMethod: ["acquisition_method", "collection_method", "method"],
  accessTimestamp: ["access_timestamp", "accessed_at", "access_date", "retrieved_at", "collected_at"],
  reuseStatus: ["reuse_status", "license", "reuse_permission", "display_permission"],
  entityCategory: ["entity_category", "category", "entity_type", "organization_type"],
  activityStatusBasis: ["activity_status_basis", "status_basis", "status_source", "operating_status_basis"],
  countryCode: ["country_code", "country_iso", "iso2", "iso3", "country"],
  admin1: ["admin1", "state", "province", "region"], admin2: ["admin2", "district", "county"], locality: ["locality", "city", "town", "municipality"],
  latitude: ["latitude", "lat"], longitude: ["longitude", "lng", "lon", "long"],
  coordinateSource: ["coordinate_source", "geocode_source", "location_source"], coordinatePrecision: ["coordinate_precision", "precision", "geocode_precision"],
};

function normalized(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function cell(value: unknown) { return value == null ? "" : String(value).trim(); }
function field(row: RawRow, name: keyof typeof aliases) { for (const alias of aliases[name]) { const key = Object.keys(row).find((candidate) => normalized(candidate) === alias); if (key && cell(row[key])) return cell(row[key]); } return ""; }
function validUrl(value: string) { try { const parsed = new URL(value); return parsed.protocol === "http:" || parsed.protocol === "https:"; } catch { return false; } }

function parseCsv(text: string): RawRow[] {
  const rows: string[][] = []; let buffer = ""; let row: string[] = []; let quoted = false;
  for (let position = 0; position < text.length; position += 1) {
    const character = text[position]; const next = text[position + 1];
    if (character === '"' && quoted && next === '"') { buffer += '"'; position += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(buffer); buffer = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && next === "\n") position += 1; row.push(buffer); if (row.some((item) => item.trim())) rows.push(row); row = []; buffer = ""; continue; }
    buffer += character;
  }
  row.push(buffer); if (row.some((item) => item.trim())) rows.push(row);
  const [header, ...body] = rows; if (!header) return [];
  return body.slice(0, MAX_ROWS).map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function parseRows(text: string, fileName: string): RawRow[] {
  if (!fileName.toLowerCase().endsWith(".json")) return parseCsv(text);
  const parsed = JSON.parse(text) as unknown;
  const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? (parsed as { records?: unknown[] }).records : undefined;
  if (!Array.isArray(records)) throw new Error("JSON must be an array of records or an object with a records array.");
  return records.filter((item): item is RawRow => Boolean(item) && typeof item === "object").slice(0, MAX_ROWS);
}

function validateRow(row: RawRow, index: number): ImportedEntity {
  const value = (key: keyof typeof aliases) => field(row, key);
  const name = value("name"); const sourceRecordId = value("sourceRecordId"); const publisher = value("publisher"); const sourceUrl = value("sourceUrl");
  const acquisitionMethod = value("acquisitionMethod"); const accessTimestamp = value("accessTimestamp"); const reuseStatus = value("reuseStatus"); const entityCategory = value("entityCategory"); const activityStatusBasis = value("activityStatusBasis");
  const countryCode = value("countryCode"); const admin1 = value("admin1"); const admin2 = value("admin2"); const locality = value("locality");
  const coordinateSource = value("coordinateSource"); const coordinatePrecision = value("coordinatePrecision");
  const latitudeText = value("latitude"); const longitudeText = value("longitude"); const latitudeNumber = Number(latitudeText); const longitudeNumber = Number(longitudeText);
  const coordinates = Number.isFinite(latitudeNumber) && Number.isFinite(longitudeNumber) && Math.abs(latitudeNumber) <= 90 && Math.abs(longitudeNumber) <= 180;
  const required = [["name", name], ["source_record_id", sourceRecordId], ["publisher", publisher], ["source_url", sourceUrl], ["acquisition_method", acquisitionMethod], ["access_timestamp", accessTimestamp], ["reuse_status", reuseStatus], ["entity_category", entityCategory], ["activity_status_basis", activityStatusBasis]] as const;
  const issues = required.filter(([, item]) => !item).map(([key]) => `Missing ${key}`);
  if (sourceUrl && !validUrl(sourceUrl)) issues.push("source_url is not an http(s) URL");
  if ((latitudeText || longitudeText) && !coordinates) issues.push("Coordinates are invalid");
  const coordinateStatement = coordinateSource.toLowerCase();
  const coordinatePermitted = coordinateStatement.includes("source") || coordinateStatement.includes("permitted") || coordinateStatement.includes("licensed");
  if (coordinates && !coordinateSource) issues.push("Pin requires coordinate_source");
  if (coordinates && coordinateSource && !coordinatePermitted) issues.push("coordinate_source must state a source-provided or permitted origin");
  if (coordinates && !coordinatePrecision) issues.push("Pin requires coordinate_precision");
  const requiredValid = issues.every((issue) => issue.startsWith("Pin requires") || issue.startsWith("coordinate_source"));
  const disposition: ImportedEntity["disposition"] = requiredValid && coordinates && coordinatePermitted && Boolean(coordinatePrecision) ? "pin" : requiredValid ? "aggregate" : "blocked";
  return { id: `${sourceRecordId || name || "row"}:${index}`, name, sourceRecordId, publisher, sourceUrl, acquisitionMethod, accessTimestamp, reuseStatus, entityCategory, activityStatusBasis, countryCode, admin1, admin2, locality, latitude: coordinates ? latitudeNumber : null, longitude: coordinates ? longitudeNumber : null, coordinateSource, coordinatePrecision, disposition, issues };
}

export default function EntityDatasetImport({ onEntitiesChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false); const [fileName, setFileName] = useState("");
  const [entities, setEntities] = useState<ImportedEntity[]>([]); const [error, setError] = useState<string | null>(null);
  const counts = useMemo(() => entities.reduce((all, entity) => ({ ...all, [entity.disposition]: all[entity.disposition] + 1 }), { pin: 0, aggregate: 0, blocked: 0 }), [entities]);
  const receiveFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setError("For browser-local review, choose a file smaller than 50 MB or split it into source-bounded releases."); return; }
    const reader = new FileReader(); reader.onerror = () => setError("The browser could not read this file.");
    reader.onload = () => { try { const rows = parseRows(String(reader.result ?? ""), file.name); if (!rows.length) throw new Error("No data records were found."); const checked = rows.map(validateRow); setEntities(checked); setFileName(file.name); setError(null); onEntitiesChange(checked); } catch (reason) { setError(reason instanceof Error ? reason.message : "This file could not be parsed."); } };
    reader.readAsText(file);
  };
  const clear = () => { setEntities([]); setFileName(""); setError(null); onEntitiesChange([]); if (fileRef.current) fileRef.current.value = ""; };

  return <div data-venture-overlay className="relative"><button onClick={() => setOpen((value) => !value)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur ${open ? "border-[#b95c78] bg-[#fff1ef] text-[#9d483c]" : "border-[#d9d6ca] bg-[#fffefb]/95 text-[#5d6058] hover:border-[#b95c78]"}`}>Import held dataset{entities.length ? ` · ${counts.pin} pins` : ""}</button>{open && <aside className="absolute left-0 top-[calc(100%+10px)] z-50 w-[min(560px,calc(100vw-2rem))] border border-[#d8d6cd] bg-[#fffefb] p-5 shadow-[0_24px_70px_rgba(36,40,34,.2)]"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-[#0f766e]"><ShieldCheck className="h-4 w-4" /> Browser-local evidence import</div><h2 className="mt-2 font-display text-3xl leading-none">Preview your own source-bounded entity file.</h2></div><button onClick={() => setOpen(false)} className="p-1 text-[#777970] hover:text-[#b95c78]" aria-label="Close dataset import"><X className="h-4 w-4" /></button></div><p className="mt-4 text-sm leading-6 text-[#62645d]">This static Atlas does not upload, store, geocode, or publish your file. It checks the evidence envelope in this browser session only. A row becomes a map pin only when it includes source-provided or permitted coordinates and a stated precision.</p><div className="mt-4 grid grid-cols-2 gap-2 border-y border-[#e4e2da] py-3 font-mono text-[8px] uppercase tracking-[.1em] text-[#777970]"><span>Required: provenance + status</span><span>For pins: source coordinates + precision</span></div><input ref={fileRef} type="file" accept=".csv,application/json,.json" className="sr-only" onChange={(event) => receiveFile(event.target.files?.[0])} /><button onClick={() => fileRef.current?.click()} className="mt-5 flex w-full items-center justify-between border border-dashed border-[#9acdc1] bg-[#edf5f3] px-4 py-4 text-left hover:border-[#0f766e]"><span><span className="block text-sm font-semibold text-[#285b54]">Choose CSV or JSON evidence file</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[.11em] text-[#4b8078]">No network upload · maximum 60,000 parsed rows</span></span><FileUp className="h-5 w-5 text-[#0f766e]" /></button>{error && <div className="mt-4 flex gap-2 border border-[#edb6a7] bg-[#fff5f4] p-3 text-sm leading-5 text-[#9d483c]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}{entities.length > 0 && <><div className="mt-5 grid grid-cols-3 gap-2"><div className="border border-[#9acdc1] bg-[#edf5f3] p-3"><div className="font-mono text-[8px] uppercase tracking-[.12em] text-[#0f766e]">Pin eligible</div><div className="mt-1 font-display text-2xl text-[#0f625b]">{counts.pin}</div></div><div className="border border-[#dfc681] bg-[#fffaf0] p-3"><div className="font-mono text-[8px] uppercase tracking-[.12em] text-[#8a6417]">Aggregate only</div><div className="mt-1 font-display text-2xl text-[#8a6417]">{counts.aggregate}</div></div><div className="border border-[#edb6a7] bg-[#fff5f4] p-3"><div className="font-mono text-[8px] uppercase tracking-[.12em] text-[#9d483c]">Blocked</div><div className="mt-1 font-display text-2xl text-[#9d483c]">{counts.blocked}</div></div></div><div className="mt-4 border-y border-[#e4e2da] py-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[.13em] text-[#777970]">{fileName}</span><button onClick={clear} className="text-xs text-[#9d483c] hover:underline">Clear local preview</button></div><div className="mt-3 max-h-36 space-y-1 overflow-auto">{entities.slice(0, 14).map((entity) => <div key={entity.id} className="flex items-start gap-2 border-b border-[#eeece6] py-2 text-xs"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${entity.disposition === "pin" ? "bg-[#0f766e]" : entity.disposition === "aggregate" ? "bg-[#ba7a48]" : "bg-[#b95c78]"}`} /><span className="min-w-0 flex-1"><strong className="block truncate text-[#45483f]">{entity.name || "Unnamed row"}</strong><span className="block truncate text-[#777970]">{entity.disposition === "pin" ? `${entity.coordinateSource} · ${entity.coordinatePrecision}` : entity.issues[0] ?? "No source coordinates; remains aggregate-only."}</span></span></div>)}</div></div><p className="mt-4 flex gap-2 text-xs leading-5 text-[#62645d]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0f766e]" />A real release retains publisher, source URL, acquisition method, access timestamp, reuse status, category, activity-status basis, coordinate source, and precision per record.</p></>}</aside>}</div>;
}
