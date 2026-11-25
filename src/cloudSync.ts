// End-to-end encrypted cloud sync via the shared gfk-api Worker (Cloudflare KV).
// The sync code never leaves the device; it derives an AES-GCM key and a lookup id.
export const API = 'https://gfk-api.mahmodsalah.workers.dev';
const APP = 'blogging-platform';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (buf: ArrayBuffer | Uint8Array) => {
  const a = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64 = (t: string) => {
  t = t.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  const s = atob(t);
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
};
const hex = (a: Uint8Array) => Array.from(a).map((x) => x.toString(16).padStart(2, '0')).join('');

export const normalize = (c: string) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const isValid = (c: string) => {
  const n = normalize(c);
  return n.length === 20 && n.split('').every((ch) => ALPHA.includes(ch));
};
export const format = (c: string) => normalize(c).replace(/(.{4})(?=.)/g, '$1-');
export const newCode = () => {
  const r = crypto.getRandomValues(new Uint8Array(20));
  return format(Array.from(r).map((x) => ALPHA[x % 32]).join(''));
};

async function derive(code: string) {
  const base = await crypto.subtle.importKey('raw', enc.encode(normalize(code)), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 200000, salt: enc.encode('gfk-sync-v1') }, base, 512));
  const key = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
  return { key, id: hex(bits.slice(32)) };
}
const url = (id: string) => `${API}/v1/${APP}/sync/${id}`;

export async function push(code: string, text: string): Promise<string> {
  if (!isValid(code)) throw new Error('bad_code');
  const d = await derive(code);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, d.key, enc.encode(text));
  const r = await fetch(url(d.id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) }) });
  if (!r.ok) throw new Error(r.status === 413 ? 'too_large' : 'server');
  return (await r.json()).updated;
}
export async function pull(code: string): Promise<{ text: string; updated: string }> {
  if (!isValid(code)) throw new Error('bad_code');
  const d = await derive(code);
  const r = await fetch(url(d.id));
  if (r.status === 404) throw new Error('not_found');
  if (!r.ok) throw new Error('server');
  const b = await r.json();
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(b.iv) }, d.key, unb64(b.ct));
    return { text: dec.decode(pt), updated: b.updated };
  } catch {
    throw new Error('bad_code');
  }
}
export async function removeRemote(code: string): Promise<void> {
  if (!isValid(code)) throw new Error('bad_code');
  const d = await derive(code);
  const r = await fetch(url(d.id), { method: 'DELETE' });
  if (!r.ok) throw new Error('server');
}
