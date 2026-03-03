import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Calendar, Tag, Edit3, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { PostCard } from '../components/PostCard';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPost, deletePost, incrementViews, posts } = useBlog();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const post = id ? getPost(id) : undefined;

  useEffect(() => {
    if (post && id) {
      incrementViews(id);
    }
    window.scrollTo(0, 0);
  }, [id]);

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

  const handleDelete = () => {
    deletePost(post.id);
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

        <div className="flex items-center gap-2">
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
        </div>
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
        className="prose prose-lg prose-slate dark:prose-invert max-w-none 
          prose-headings:text-slate-900 dark:prose-headings:text-white 
          prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
          prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50/50 dark:prose-blockquote:bg-orange-950/20 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-xl
          prose-img:rounded-3xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-slate-800"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

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
