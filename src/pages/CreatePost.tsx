import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useBlog } from '../context/BlogContext';
import { PostForm } from '../components/PostForm';

export function CreatePost() {
  const { user, loading, refresh } = useAuth();
  const { reloadFeed } = useBlog();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  if (loading) return <div className="pt-40 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login?next=/create" replace />;

  const handleSubmit = async (title: string, content: string, tags: string[], coverImage?: string, featured?: boolean, opts?: { status: string; publishAt?: number }) => {
    try {
      const r = await api<{ post: { id: string } }>('/posts', { method: 'POST', body: { title, content, tags, coverImage, featured, status: opts?.status, publishAt: opts?.publishAt } });
      await reloadFeed(); refresh();
      navigate(opts?.status === 'draft' ? '/dashboard' : `/post/${r.post.id}`);
    } catch (e: any) { setError(e.message); }
  };
  return (<>{error && <p role="alert" className="max-w-4xl mx-auto pt-28 px-4 text-red-600 font-semibold">{error}</p>}<PostForm onSubmit={handleSubmit} /></>);
}
