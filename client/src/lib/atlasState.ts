export type AtlasSnapshot = {
  profile: string;
  favorites: string[];
  progress: Record<string, boolean>;
  notes: Record<string, string>;
  plans: Array<Record<string, unknown>>;
};

type AtlasAction = Record<string, unknown>;

const PROFILE_KEY = "atlas-profile-id";

export function getAtlasProfileId() {
  const existing = localStorage.getItem(PROFILE_KEY);
  if (existing) return existing;
  const generated = `private-${crypto.randomUUID()}`;
  localStorage.setItem(PROFILE_KEY, generated);
  return generated;
}

export async function syncAtlasAction(action: AtlasAction): Promise<AtlasSnapshot | null> {
  try {
    const response = await fetch(`/api/state?profile=${encodeURIComponent(getAtlasProfileId())}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-atlas-profile": getAtlasProfileId() },
      body: JSON.stringify(action),
    });
    if (!response.ok) return null;
    return await response.json() as AtlasSnapshot;
  } catch {
    return null;
  }
}

export async function loadAtlasSnapshot(): Promise<AtlasSnapshot | null> {
  try {
    const response = await fetch(`/api/state?profile=${encodeURIComponent(getAtlasProfileId())}`, { headers: { "x-atlas-profile": getAtlasProfileId() } });
    if (!response.ok) return null;
    return await response.json() as AtlasSnapshot;
  } catch {
    return null;
  }
}
