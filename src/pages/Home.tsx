import React, { useMemo } from 'react';
import { useBlog } from '../context/BlogContext';
import { PostCard } from '../components/PostCard';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { Newsletter } from '../components/Newsletter';
import { ParticleBackground } from '../components/ParticleBackground';
import { motion } from 'motion/react';

export function Home() {
  const { posts, searchQuery, setSearchQuery, filteredAndSortedPosts } = useBlog();

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).slice(0, 10);
  }, [posts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-24 pb-12"
    >
      {/* Atmospheric Hero Section - Full Width & Shorter */}
      <section className="relative hero-atmospheric min-h-[500px] flex items-center justify-center text-center p-12 rounded-none overflow-hidden w-full">
        <ParticleBackground />
        <div className="hero-glow" />
        
        {/* Blended Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent z-20" />
        
        <div className="relative z-10 space-y-8 max-w-5xl px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.9] uppercase hover:scale-[1.02] transition-transform cursor-default select-none drop-shadow-2xl dark:text-white">
              Blogging
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-orange-500 tracking-[0.3em] uppercase">
              bold, never regular.
            </p>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base md:text-lg text-foreground/70 dark:text-white/70 leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Explore the intersection of AI, automation, and modern agency building. 
            Insights for the next generation of digital entrepreneurs.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Related Posts Section (Home Page) */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Recommended for you</h2>
          <div className="h-px flex-grow mx-8 bg-slate-100 dark:bg-slate-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.slice(0, 3).map((post, index) => (
            <PostCard key={`recommended-${post.id}`} post={post} index={index} />
          ))}
        </div>
      </section>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => setSearchQuery('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
            !searchQuery
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setSearchQuery(tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              searchQuery === tag
                ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Post List */}
        <div className="lg:col-span-8 space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
            {filteredAndSortedPosts.length > 0 ? (
              filteredAndSortedPosts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <p className="text-slate-500 dark:text-slate-400">No posts found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-12">
          <TrendingSidebar posts={posts} />
          <Newsletter />
        </aside>
      </div>
    </div>
  </motion.div>
);
}
