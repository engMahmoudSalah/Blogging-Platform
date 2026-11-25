import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useBlog } from '../context/BlogContext';
import { Post } from '../types';
import { PostForm } from '../components/PostForm';

export function EditPost() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { reloadFeed } = useBlog();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api<{ posts: Post[] }>('/posts').then((r) => setPost(r.posts.find((p) => p.id === id) || null)).catch(() => setPost(null));
  }, [user, id]);

  if (loading || (user && post === undefined)) return <div className="pt-40 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to={`/login?next=/edit/${id}`} replace />;
  if (!post) return (
    <div className="flex flex-col items-center justify-center py-20 pt-40 text-center">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Post not found</h2>
      <button onClick={() => navigate('/dashboard')} className="text-orange-600 font-bold">Back to your studio</button>
    </div>
  );

  const handleSubmit = async (title: string, content: string, tags: string[], coverImage?: string, featured?: boolean, opts?: { status: string; publishAt?: number }) => {
    try {
      await api('/posts/' + post.id, { method: 'PUT', body: { title, content, tags, coverImage, featured, status: opts?.status, publishAt: opts?.publishAt } });
      await reloadFeed();
      navigate(opts?.status === 'draft' ? '/dashboard' : `/post/${post.id}`);
    } catch (e: any) { setError(e.message); }
  };
  return (<>{error && <p role="alert" className="max-w-4xl mx-auto pt-28 px-4 text-red-600 font-semibold">{error}</p>}
    <PostForm initialData={{ title: post.title, content: post.content, tags: post.tags, coverImage: post.coverImage, featured: post.featured, status: post.status, publishAt: post.publishAt }} onSubmit={handleSubmit} isEditing /></>);
}
