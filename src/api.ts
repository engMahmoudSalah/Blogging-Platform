export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  let data: any = null;
  try { data = await r.json(); } catch { /* empty */ }
  if (!r.ok) throw new ApiError(r.status, data?.error?.code || 'ERROR', data?.error?.message || 'Request failed');
  return data as T;
}
