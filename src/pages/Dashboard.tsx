import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useBlog } from '../context/BlogContext';
import { Post } from '../types';

interface Stats { posts: number; views: number; likes: number; drafts: number; pending: number; top: { id: string; title: string; views: number; likes: number }[] }
interface Cmt { id: number; post_id: string; name: string; body: string; status: string; created: number; title: string }

export function Dashboard() {
  const { user, loading, refresh } = useAuth();
  const { reloadFeed } = useBlog();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [comments, setComments] = useState<Cmt[]>([]);
  const [tab, setTab] = useState<'posts' | 'comments' | 'profile' | 'admin'>('posts');
  const [profile, setProfile] = useState({ name: '', bio: '', avatar: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [p, s, c] = await Promise.all([api<{ posts: Post[] }>('/posts'), api<Stats>('/stats'), api<{ comments: Cmt[] }>('/comments')]);
    setPosts(p.posts); setStats(s); setComments(c.comments);
  }, []);
  useEffect(() => { if (user) { load().catch(() => {}); setProfile({ name: user.name, bio: user.bio, avatar: user.avatar }); } }, [user, load]);


  const del = async (id: string) => { if (!confirm('Delete this post and its comments?')) return; await api('/posts/' + id, { method: 'DELETE' }); await load(); reloadFeed(); refresh(); };
  const moderate = async (id: number, action: 'approve' | 'delete') => { await api(`/comments/${id}/${action}`, { method: 'POST' }); load(); };
  const [adminKey, setAdminKey] = useState('');
  const [subs, setSubs] = useState<{ email: string; created: number }[] | null>(null);
  const [aMsg, setAMsg] = useState('');
  const loadSubs = async () => { try { const r = await api<{ subscribers: { email: string; created: number }[] }>('/admin/subscribers'); setSubs(r.subscribers); setAMsg(''); } catch (e: any) { setSubs(null); setAMsg(e.message); } };
  const claim = async () => { try { await api('/admin/claim', { method: 'POST', body: { key: adminKey } }); setAdminKey(''); await refresh(); await loadSubs(); } catch (e: any) { setAMsg(e.message); } };
  useEffect(() => { if (tab === 'admin' && user?.role === 'admin') loadSubs(); }, [tab, user]);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwMsg, setPwMsg] = useState('');
  const changePw = async () => { setPwMsg(''); try { await api('/account/password', { method: 'POST', body: pw }); setPw({ current: '', next: '' }); setPwMsg('Password changed'); } catch (e: any) { setPwMsg(e?.message || 'Could not change the password'); } };
  const deleteAccount = async () => { const p = prompt('Your account and posts will be deleted in 7 days. You can restore the account any time before then. Type your password to confirm.'); if (!p) return; try { await api('/account', { method: 'DELETE', body: { password: p } }); await refresh(); setPwMsg('Deletion scheduled. You can restore your account below.'); } catch (e: any) { setPwMsg(e?.message || 'Could not schedule the deletion'); } };
  const exportData = async () => { try { const r = await fetch('/api/account/export', { credentials: 'same-origin' }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || 'Export failed'); const url = URL.createObjectURL(await r.blob()); const el = document.createElement('a'); el.href = url; el.download = 'quill-export.json'; document.body.appendChild(el); el.click(); el.remove(); URL.revokeObjectURL(url); setPwMsg('Export downloaded.'); } catch (e: any) { setPwMsg(e?.message || 'Export failed'); } };
  const restoreAccount = async () => { try { await api('/account/restore', { method: 'POST', body: {} }); await refresh(); setPwMsg('Account restored.'); } catch (e: any) { setPwMsg(e?.message || 'Could not restore the account'); } };
  const saveProfile = async () => { await api('/account', { method: 'PATCH', body: profile }); await refresh(); setMsg('Saved'); setTimeout(() => setMsg(''), 2000); };
  const badge = (p: Post) => p.status === 'draft' ? ['Draft', 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'] : p.status === 'scheduled' && (p.publishAt || 0) > Date.now() ? ['Scheduled ' + format(new Date(p.publishAt as number), 'MMM d, HH:mm'), 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'] : ['Published', 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'];
  const card = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5';
  const tabBtn = (t: typeof tab, label: string) => <button onClick={() => setTab(t)} aria-pressed={tab === t} className={`px-4 py-2 rounded-full text-sm font-bold ${tab === t ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>{label}</button>;

  if (loading) return <div className="pt-40 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login?next=/dashboard" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-32 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your studio</h1>
          <p className="text-slate-600 dark:text-slate-400">@{user.handle} · {user.plan === 'pro' ? 'Pro' : 'Free'} plan · {user.postCount ?? posts.length} of {user.postLimit} posts used</p>
        </div>
        <div className="flex gap-3">
          <a href={`/api/rss/${user.handle}`} className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200">Your RSS</a>
          <Link to="/create" className="px-5 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold">New post</Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[['Posts', stats.posts], ['Views', stats.views], ['Likes', stats.likes], ['Comments to review', stats.pending]].map(([k, v]) => (
            <div key={k as string} className={card}><div className="text-3xl font-bold text-slate-900 dark:text-white">{v}</div><div className="text-sm text-slate-600 dark:text-slate-400">{k}</div></div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6" role="group" aria-label="Dashboard sections">{tabBtn('posts', 'Posts')}{tabBtn('comments', `Comments${stats?.pending ? ' (' + stats.pending + ')' : ''}`)}{tabBtn('admin', 'Admin')}{tabBtn('profile', 'Profile')}</div>

      {tab === 'posts' && (
        <div className="space-y-3">
          {posts.length === 0 && <p className="text-slate-600 dark:text-slate-400">No posts yet. Write your first one.</p>}
          {posts.map((p) => { const [label, cls] = badge(p); return (
            <div key={p.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div className="min-w-0">
                <Link to={`/post/${p.id}`} className="font-bold text-slate-900 dark:text-white hover:text-orange-600 truncate block">{p.title}</Link>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{p.views} views · {p.likes} likes · {p.commentCount || 0} comments{p.pendingComments ? ` (${p.pendingComments} pending)` : ''}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
                <Link to={`/edit/${p.id}`} className="text-sm font-bold text-orange-600">Edit</Link>
                <button onClick={() => del(p.id)} className="text-sm font-bold text-red-600">Delete</button>
              </div>
            </div>); })}
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-3">
          {comments.length === 0 && <p className="text-slate-600 dark:text-slate-400">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className={card}>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">{c.name} on <Link className="underline" to={`/post/${c.post_id}`}>{c.title}</Link> · {c.status}</div>
              <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{c.body}</p>
              <div className="flex gap-4 mt-3">
                {c.status !== 'approved' && <button onClick={() => moderate(c.id, 'approve')} className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Approve</button>}
                <button onClick={() => moderate(c.id, 'delete')} className="text-sm font-bold text-red-600">Delete</button>
              </div>
            </div>))}
        </div>
      )}

      {tab === 'admin' && (
        <div className="max-w-xl space-y-4">
          {user.role !== 'admin' ? (
            <>
              <p className="text-slate-700 dark:text-slate-300">Enter the admin key to see newsletter subscribers.</p>
              <input type="password" aria-label="Admin key" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              <button onClick={claim} className="px-5 py-2 rounded-full bg-orange-600 text-white font-bold">Unlock</button>
            </>
          ) : (
            <>
              <p className="font-bold text-slate-900 dark:text-white">{subs ? subs.length : 0} subscribers <a className="ml-3 text-sm text-orange-700 dark:text-orange-400 underline" href="/api/admin/subscribers?format=csv">Download CSV</a></p>
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">{(subs || []).map((x) => <li key={x.email} className="flex justify-between gap-3 px-4 py-2 text-sm text-slate-800 dark:text-slate-200"><span className="break-all">{x.email}</span><span className="text-slate-500 shrink-0">{new Date(x.created).toLocaleDateString()}</span></li>)}</ul>
            </>
          )}
          {aMsg && <p role="status" className="text-sm text-red-700 dark:text-red-400">{aMsg}</p>}
        </div>
      )}

      {tab === 'profile' && (
        <div className={`${card} space-y-4 max-w-lg`}>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Name<input className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Bio<textarea className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white" rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Avatar URL (https)<input className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white" value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} /></label>
          <button onClick={saveProfile} className="px-5 py-2 rounded-full bg-orange-600 text-white font-bold">Save profile</button> <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</span>
          <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white">Account security</h3>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Current password<input type="password" autoComplete="current-password" className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">New password (8+ characters)<input type="password" autoComplete="new-password" className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
            <button onClick={changePw} className="px-5 py-2 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold">Change password</button> <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{pwMsg}</span>
            <div><button onClick={exportData} className="text-sm font-semibold text-slate-800 dark:text-slate-200 underline">Download my data (JSON)</button></div>
            {(user as any)?.deletionScheduledAt ? (
              <div role="status" className="p-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-sm text-red-900 dark:text-red-200 space-y-2">
                <p>Your account is scheduled for deletion on {new Date((user as any).deletionScheduledAt).toLocaleDateString()}. Restore it before then to keep your posts.</p>
                <button onClick={restoreAccount} className="px-4 py-1.5 rounded-full bg-emerald-700 text-white font-bold">Restore my account</button>
              </div>
            ) : (
              <div><button onClick={deleteAccount} className="text-sm font-semibold text-red-700 dark:text-red-400 underline">Delete my account (7-day grace period)</button></div>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 pt-2">Plans: Free (25 posts) and Pro (500 posts, coming soon). Nothing is charged.</p>
        </div>
      )}
    </div>
  );
}
