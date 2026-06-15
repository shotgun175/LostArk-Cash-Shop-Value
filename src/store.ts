import type { PricePayload } from "./normalize";

const KEY = "prices:latest";

export async function readPayload(kv: KVNamespace): Promise<PricePayload | null> {
  return await kv.get<PricePayload>(KEY, "json");
}

export async function writePayload(kv: KVNamespace, payload: PricePayload): Promise<void> {
  await kv.put(KEY, JSON.stringify(payload));
}
