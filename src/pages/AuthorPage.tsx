import type React from "react";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Rss } from 'lucide-react';
import { api } from '../api';
import { PostCard } from '../components/PostCard';
import { Post } from '../types';

export function AuthorPage({ notFound }: { notFound: () => React.ReactElement }) {
  const params = useParams();
  const raw = params.handle || params.at || '';
  const handle = raw.replace(/^@/, '').toLowerCase();
  const valid = /^[a-z0-9_-]{3,20}$/.test(handle) && (params.handle !== undefined || raw.startsWith('@'));
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!valid) return;
    setPosts(null); setErr(false);
    api<{ posts: Post[] }>(`/public/posts?author=${encodeURIComponent(handle)}&limit=50`)
      .then((r) => setPosts(r.posts))
      .catch(() => setErr(true));
    document.title = `@${handle} | Quill`;
  }, [handle, valid]);

  if (!valid) return notFound();
  if (err) return <div className="max-w-xl mx-auto px-6 py-28 text-center text-zinc-500">Could not load this author. Try again in a moment.</div>;
  if (!posts) return <div className="max-w-xl mx-auto px-6 py-28 text-center text-zinc-500" aria-busy="true">Loading...</div>;
  if (posts.length === 0) return notFound();

  const a = posts[0].author;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16" data-testid="author-page">
      <header className="flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
        <img src={a.avatar} alt="" className="w-20 h-20 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100" referrerPolicy="no-referrer" />
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{a.name}</h1>
          <p className="text-slate-500">@{handle} &middot; {posts.length} {posts.length === 1 ? 'story' : 'stories'}</p>
          {a.bio && <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">{a.bio}</p>}
        </div>
        <a href={`/api/rss/${handle}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600"><Rss size={16} />RSS</a>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
      </div>
      <p className="mt-10"><Link to="/" className="text-orange-600 font-semibold">&larr; All stories</Link></p>
    </div>
  );
}
