import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Calendar, Tag, Edit3, Trash2, Link2, Share2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { PostCard } from '../components/PostCard';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { sanitizeHtml } from '../utils/sanitize';
import { Post } from '../types';

function ShareBar({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  const url = typeof location !== 'undefined' ? location.href : '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch { /* ignore */ } t.remove(); }
    setDone(true); setTimeout(() => setDone(false), 2000);
  };
  const share = () => { (navigator as Navigator & { share?: (d: { title: string; url: string }) => Promise<void> }).share?.({ title, url }).catch(() => {}); };
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const b = 'inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 transition-colors';
  return (
    <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-wrap items-center gap-3" data-testid="share-bar">
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Share</span>
      <button type="button" onClick={copy} className={b} aria-live="polite">{done ? <Check size={16} /> : <Link2 size={16} />}{done ? 'Link copied' : 'Copy link'}</button>
      {canShare && <button type="button" onClick={share} className={b}><Share2 size={16} />Share</button>}
    </div>
  );
}

function Comments({ id }: { id: string }) {
  const [list, setList] = useState<{ id: number; name: string; body: string; created: number }[]>([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { api<{ comments: typeof list }>(`/public/posts/${id}/comments`).then((r) => setList(r.comments)).catch(() => {}); }, [id]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setNote('');
    try { await api(`/public/posts/${id}/comments`, { method: 'POST', body: { name, body, website } }); setBody(''); setNote('Thanks! Your comment will appear after the author approves it.'); }
    catch (err: any) { setNote(err.message); }
  };
  const f = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white';
  return (
    <section className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800" aria-labelledby="cm-h">
      <h3 id="cm-h" className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Comments ({list.length})</h3>
      <ul className="space-y-4 mb-8">{list.map((c) => (<li key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><div className="text-sm font-bold text-slate-900 dark:text-white">{c.name} <span className="font-normal text-slate-500">· {format(new Date(c.created), 'MMM d, yyyy')}</span></div><p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-1">{c.body}</p></li>))}</ul>
      <form onSubmit={send} className="space-y-3">
        <input className={f} placeholder="Your name" aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        <textarea className={f} placeholder="Write a comment" aria-label="Comment" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} required />
        <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <button className="px-5 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Post comment</button>
        {note && <p role="status" className="text-sm text-slate-700 dark:text-slate-300">{note}</p>}
      </form>
    </section>
  );
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPost, deletePost, incrementViews, posts, serverMode, reloadFeed } = useBlog();
  const { user } = useAuth();
  const [fetched, setFetched] = useState<Post | null>(null);
  const [tried, setTried] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const found = id ? getPost(id) : undefined;
  useEffect(() => {
    setFetched(null); setTried(false);
    if (id && !found) api<{ post: Post }>('/public/posts/' + id).then((r) => setFetched(r.post)).catch(() => {}).finally(() => setTried(true));
  }, [id]);
  const post = found || fetched || undefined;
  const isOwner = !!(user && post && post.author.handle === user.handle);

  useEffect(() => {
    if (post && id) {
      if (serverMode || fetched) incrementViews(id), (fetched && !serverMode && (() => { const k = 'viewed_' + id; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); api('/public/posts/' + id + '/view', { method: 'POST' }).catch(() => {}); } })());
      else incrementViews(id);
    }
    window.scrollTo(0, 0);
  }, [id, !!post]);

  if (!post && id && !tried && !found) return <div className="pt-40 text-center text-slate-500">Loading...</div>;
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Post not found</h2>
        <Link to="/" className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Blog
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (isOwner) { await api('/posts/' + post.id, { method: 'DELETE' }); await reloadFeed(); } else deletePost(post.id);
    navigate('/');
  };

  const relatedPosts = posts
    .filter(p => p.id !== post.id && p.tags.some(t => post.tags.includes(t)))
    .slice(0, 2);

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 pt-32"
    >
      <div className="mb-8 flex items-center justify-between">
        <Link to="/" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 font-medium">
          <ArrowLeft size={18} />
          <span>Back to Blog</span>
        </Link>

        {(isOwner || !serverMode) && <div className="flex items-center gap-2">
          <Link
            to={`/edit/${post.id}`}
            className="p-2 text-slate-400 hover:text-orange-500 transition-colors"
          >
            <Edit3 size={18} />
          </Link>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>}
      </div>

      <header className="space-y-6 mb-10">
        <div className="flex flex-wrap gap-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500 font-medium pb-6 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{post.readingTime} min read</span>
          </div>
          {post.author.handle && <span>by {post.author.name} (@{post.author.handle})</span>}
        </div>
      </header>

      {post.coverImage && (
        <div className="w-full rounded-3xl overflow-hidden mb-12 border border-slate-200 dark:border-slate-800">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-auto object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div 
        className="break-words [overflow-wrap:break-word] max-w-full overflow-x-hidden [&_p]:whitespace-normal prose prose-lg prose-slate dark:prose-invert max-w-none 
          prose-headings:text-slate-900 dark:prose-headings:text-white 
          prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
          prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50/50 dark:prose-blockquote:bg-orange-950/20 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-xl
          prose-img:rounded-3xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-slate-800"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
      />

      <ShareBar title={post.title} />

      {(serverMode || fetched) && <Comments id={post.id} />}

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <div className="mt-24 pt-12 border-t border-slate-100 dark:border-slate-900">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Read Next</h3>
            <Link to="/" className="text-orange-500 font-bold hover:underline">View all posts</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {relatedPosts.map((relatedPost, index) => (
              <PostCard key={relatedPost.id} post={relatedPost} index={index} />
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </motion.article>
  );
}
