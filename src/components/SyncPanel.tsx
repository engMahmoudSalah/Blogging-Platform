import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, X } from 'lucide-react';
import { format, isValid, newCode, pull, push, removeRemote } from '../cloudSync';
import { useBlog } from '../context/BlogContext';
import type { Post } from '../types';

const KEY = 'blog_sync_code';
const MSG: Record<string, string> = {
  bad_code: 'Wrong code, or nothing to decrypt with it.',
  not_found: 'No copy exists for this code yet. Upload from your other device first.',
  too_large: 'Your posts are too large to sync (200 KB limit). Remove big cover images and try again.',
  server: 'The server is not reachable right now. Try again in a moment.',
};
const looksLikePosts = (d: any): d is Post[] =>
  Array.isArray(d) && d.every((p) => p && typeof p.id === 'string' && typeof p.title === 'string' && typeof p.content === 'string' && Array.isArray(p.tags));

// Optional end-to-end encrypted sync of your posts. Connected devices upload automatically (debounced).
export function SyncPanel() {
  const { posts, replacePosts } = useBlog();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(() => localStorage.getItem(KEY) || '');
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [when, setWhen] = useState('');
  const first = useRef(true);

  const say = (t: string, ok: boolean) => setMsg({ t, ok });
  const save = (c: string) => { setCode(c); c ? localStorage.setItem(KEY, c) : localStorage.removeItem(KEY); };
  const fmt = (iso: string) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!code) return;
    const h = setTimeout(() => { push(code, JSON.stringify(posts)).then((u) => setWhen(fmt(u))).catch(() => {}); }, 15000);
    return () => clearTimeout(h);
  }, [posts, code]);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setMsg(null); try { await fn(); } catch (e: any) { say(MSG[e?.message] || MSG.server, false); } setBusy(false); };
  const create = () => run(async () => { const c = newCode(); const u = await push(c, JSON.stringify(posts)); save(c); setWhen(fmt(u)); say('Code created and your posts were uploaded, encrypted. Save the code now.', true); });
  const connect = () => run(async () => {
    if (!isValid(input)) { say('The code is 20 letters and digits.', false); return; }
    const r = await pull(input); const d = JSON.parse(r.text);
    if (!looksLikePosts(d)) throw new Error('bad_code');
    replacePosts(d); save(format(input)); setWhen(fmt(r.updated)); setInput(''); say(`Device linked. Restored ${d.length} posts.`, true);
  });
  const download = () => run(async () => {
    if (!window.confirm('This replaces your posts on this device with the cloud copy. Continue?')) return;
    const r = await pull(code); const d = JSON.parse(r.text);
    if (!looksLikePosts(d)) throw new Error('bad_code');
    replacePosts(d); setWhen(fmt(r.updated)); say('Restored from the cloud.', true);
  });
  const upload = () => run(async () => { const u = await push(code, JSON.stringify(posts)); setWhen(fmt(u)); say('Uploaded (encrypted).', true); });
  const forget = () => { if (window.confirm('This device forgets the code (the cloud copy stays). Make sure you saved it.')) { save(''); say('Device disconnected.', true); } };
  const wipe = () => run(async () => { if (!window.confirm('Delete your cloud copy permanently? Posts on your devices are not affected.')) return; await removeRemote(code); save(''); say('Cloud copy deleted.', true); });

  const btn = 'px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50';
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Cloud sync" title={code ? 'Sync is on' : 'Cloud sync'}
        className={`p-2.5 transition-colors border rounded-full bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 ${code ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400 hover:text-orange-500'}`}>
        <Cloud size={20} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Cloud sync" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-slate-200 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Encrypted cloud sync</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-orange-500" aria-label="Close"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-6">Keep your posts on all your devices, no account needed. They are encrypted on your device before upload and the server only stores unreadable data. Only the code opens it, so keep it safe.</p>
            {!code ? (
              <div className="space-y-3">
                <button disabled={busy} onClick={create} className={`${btn} bg-orange-500 hover:bg-orange-600 text-white w-full`}>Create a new sync code</button>
                <label className="block text-sm text-slate-500 mt-3" htmlFor="sync-in">Or enter a code from another device</label>
                <input id="sync-in" value={input} onChange={(e) => setInput(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 font-mono text-sm" />
                <button disabled={busy} onClick={connect} className={`${btn} bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 w-full`}>Link this device and download my posts</button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm text-slate-500" htmlFor="sync-code">Your secret code (keep it safe)</label>
                <input id="sync-code" readOnly value={code} className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 font-mono text-sm" />
                <p className="text-xs text-slate-500">{when ? `Last upload: ${when}` : 'Changes upload by themselves a few seconds after each edit.'}</p>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={upload} className={`${btn} bg-orange-500 hover:bg-orange-600 text-white`}>Upload now</button>
                  <button disabled={busy} onClick={download} className={`${btn} bg-slate-100 dark:bg-slate-800`}>Download</button>
                  <button disabled={busy} onClick={forget} className={`${btn} bg-slate-100 dark:bg-slate-800`}>Disconnect</button>
                  <button disabled={busy} onClick={wipe} className={`${btn} bg-red-600 text-white`}>Delete cloud copy</button>
                </div>
              </div>
            )}
            {msg && <p role="status" className={`mt-4 text-sm rounded-xl px-3 py-2 ${msg.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/10 text-red-600 dark:text-red-300'}`}>{msg.t}</p>}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
