type IndiaTileRequest = {
  id: number;
  cacheKey: string;
  url: string;
};

type IndiaTileResult = {
  id: number;
  cacheKey: string;
  ok: boolean;
  tile?: unknown;
  error?: string;
};

self.addEventListener("message", async (event: MessageEvent<IndiaTileRequest>) => {
  const { id, cacheKey, url } = event.data;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Tile request failed (${response.status})`);
    const tile = await response.json();
    self.postMessage({ id, cacheKey, ok: true, tile } satisfies IndiaTileResult);
  } catch (cause) {
    self.postMessage({
      id,
      cacheKey,
      ok: false,
      error: cause instanceof Error ? cause.message : "Tile request failed",
    } satisfies IndiaTileResult);
  }
});
