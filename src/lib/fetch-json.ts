export async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ data: T | null; ok: boolean; status: number }> {
  const res = await fetch(url, init);
  const text = await res.text();

  if (!text) {
    return { data: null, ok: res.ok, status: res.status };
  }

  try {
    return { data: JSON.parse(text) as T, ok: res.ok, status: res.status };
  } catch {
    console.error(`[fetchJson] Invalid JSON from ${url} (${res.status})`);
    return { data: null, ok: false, status: res.status };
  }
}
