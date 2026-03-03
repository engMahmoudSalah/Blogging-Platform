import { Link } from 'react-router-dom';
import { Post } from '../types';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';

export function TrendingSidebar({ posts }: { posts: Post[] }) {
  const trending = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-10 flex items-center gap-3">
        <TrendingUp size={24} className="text-orange-500" />
        Trending Now
      </h3>
      <div className="space-y-10">
        {trending.map((post, i) => (
          <Link key={post.id} to={`/post/${post.id}`} className="group flex gap-6 items-start">
            <span className="text-5xl font-bold text-slate-200 dark:text-slate-800 group-hover:text-orange-500/20 transition-colors leading-none">
              {i + 1}
            </span>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors line-clamp-2 leading-tight">
                {post.title}
              </h4>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-500">
                {format(new Date(post.createdAt), 'MMM d')} · {post.readingTime} min read
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
