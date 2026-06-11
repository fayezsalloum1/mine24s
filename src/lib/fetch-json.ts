export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<{ data: T | null; ok: boolean; status: number }> {
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    ...init,
    headers: {
      ...init?.headers,
    },
  });
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

/** Retry transient server/network failures (common on serverless cold starts). */
export async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
  attempts = 3
): Promise<{ data: T | null; ok: boolean; status: number }> {
  let last = { data: null as T | null, ok: false, status: 0 };

  for (let i = 0; i < attempts; i++) {
    last = await fetchJson<T>(url, init);
    if (last.ok && last.data) return last;
    if (last.status === 401 || last.status === 404) return last;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }

  return last;
}
