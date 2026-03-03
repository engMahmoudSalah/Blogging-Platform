import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import { Post } from '../types';
import { motion } from 'motion/react';

interface PostCardProps {
  post: Post;
  index: number;
}

export function PostCard({ post, index }: PostCardProps) {
  // Extract a clean excerpt from HTML content
  const excerpt = post.content
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .slice(0, 160) + '...';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group flex flex-col space-y-6"
    >
      <Link to={`/post/${post.id}`} className="block overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1">
        {post.coverImage ? (
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-slate-400">No image</span>
          </div>
        )}
      </Link>

      <div className="space-y-3 px-2">
        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em]">
              {tag}
            </span>
          ))}
        </div>

        <Link to={`/post/${post.id}`}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors leading-tight">
            {post.title}
          </h2>
        </Link>

        <p className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 text-sm">
          {excerpt}
        </p>

        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{post.readingTime} min read</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
