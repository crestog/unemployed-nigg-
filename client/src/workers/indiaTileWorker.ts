type IndiaTileRequest = {
  type?: "fetch" | "cancel";
  id: number;
  cacheKey: string;
  url?: string;
};

type IndiaTileResult = {
  id: number;
  cacheKey: string;
  ok: boolean;
  tile?: unknown;
  error?: string;
};

const controllers = new Map<number, AbortController>();

self.addEventListener(
  "message",
  async (event: MessageEvent<IndiaTileRequest>) => {
    const { type = "fetch", id, cacheKey, url } = event.data;
    if (type === "cancel") {
      controllers.get(id)?.abort();
      controllers.delete(id);
      return;
    }
    if (!url) return;
    const controller = new AbortController();
    controllers.set(id, controller);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok)
        throw new Error(`Tile request failed (${response.status})`);
      const tile = await response.json();
      self.postMessage({
        id,
        cacheKey,
        ok: true,
        tile,
      } satisfies IndiaTileResult);
    } catch (cause) {
      if (controller.signal.aborted) return;
      self.postMessage({
        id,
        cacheKey,
        ok: false,
        error: cause instanceof Error ? cause.message : "Tile request failed",
      } satisfies IndiaTileResult);
    } finally {
      controllers.delete(id);
    }
  }
);
