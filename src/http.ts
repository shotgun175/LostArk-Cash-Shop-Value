// Hardened JSON body reader for untrusted upstreams. res.json() buffers the entire body before any
// size check can run, and a Content-Length fast-reject alone is advisory: chunked/streamed responses
// omit the header entirely and a malformed value parses to NaN, so the real guard has to sit on the
// bytes as they arrive.
export async function readJsonCapped(res: Response, maxBytes: number, label: string): Promise<unknown> {
  const len = res.headers.get("content-length");
  if (len !== null) {
    const declared = Number(len);
    // Fast-reject on the declared size; a malformed (NaN) declaration is treated as hostile rather
    // than falling through the old `NaN > cap === false` hole.
    if (!Number.isFinite(declared) || declared > maxBytes) {
      throw new Error(`${label} body too large: content-length ${len}`);
    }
  }
  if (!res.body) {
    // No stream (empty body) -> let JSON.parse produce the usual syntax error for the caller.
    return JSON.parse(await res.text());
  }
  // Stream-accumulate with a hard cap so the guard holds regardless of transfer encoding.
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`${label} body too large: over ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(buf));
}
