// The one door to localStorage. When a browser blocks site data, even reading
// window.localStorage throws (SecurityError), and setItem can throw on a full quota; in node tests
// and prerender there is no localStorage at all. Saved inputs are a convenience, so every failure
// degrades to "nothing stored" instead of taking the page down.

/** The stored string for `key`, or null when it is absent or storage is unavailable. */
export function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores `value` under `key` (null removes the key); does nothing when storage is unavailable. */
export function save(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* blocked or full: the in-memory value still applies */
  }
}
