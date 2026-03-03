import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Post } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateReadingTime } from '../utils/readingTime';
import { seedPosts } from '../utils/seedData';

interface BlogContextType {
  posts: Post[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'newest' | 'oldest' | 'popular';
  setSortBy: (sort: 'newest' | 'oldest' | 'popular') => void;
  filteredAndSortedPosts: Post[];
  storageError: boolean;
  setStorageError: (error: boolean) => void;
  addPost: (title: string, content: string, tags: string[], coverImage?: string, featured?: boolean) => void;
  updatePost: (id: string, title: string, content: string, tags: string[], coverImage?: string, featured?: boolean) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => Post | undefined;
  toggleLike: (id: string) => void;
  incrementViews: (id: string) => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [storageError, setStorageError] = useState(false);
  const [posts, setPosts] = useLocalStorage<Post[]>('blog_posts', [], (err) => {
    if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      setStorageError(true);
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  useEffect(() => {
    if (posts.length === 0) {
      setPosts(seedPosts);
    }
  }, []);

  const defaultAuthor = {
    name: 'Current User',
    avatar: 'https://picsum.photos/seed/user/150/150',
    bio: 'A passionate writer.'
  };

  const addPost = (title: string, content: string, tags: string[], coverImage?: string, featured?: boolean) => {
    const newPost: Post = {
      id: uuidv4(),
      title,
      content,
      tags,
      readingTime: calculateReadingTime(content),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      coverImage: coverImage || `https://picsum.photos/seed/${uuidv4()}/1200/600`,
      author: defaultAuthor,
      likes: 0,
      views: 0,
      featured: featured || false
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (id: string, title: string, content: string, tags: string[], coverImage?: string, featured?: boolean) => {
    setPosts(prev => prev.map(post => 
      post.id === id 
        ? { ...post, title, content, tags, coverImage, featured, readingTime: calculateReadingTime(content), updatedAt: Date.now() }
        : post
    ));
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(post => post.id !== id));
  };

  const getPost = (id: string) => {
    return posts.find(post => post.id === id);
  };

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(post => 
      post.id === id ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const incrementViews = (id: string) => {
    setPosts(prev => prev.map(post => 
      post.id === id ? { ...post, views: (post.views || 0) + 1 } : post
    ));
  };

  const filteredAndSortedPosts = useMemo(() => {
    let result = posts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
      return a.createdAt - b.createdAt;
    });

    return result;
  }, [posts, searchQuery, sortBy]);

  return (
    <BlogContext.Provider value={{
      posts,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      filteredAndSortedPosts,
      storageError,
      setStorageError,
      addPost,
      updatePost,
      deletePost,
      getPost,
      toggleLike,
      incrementViews
    }}>
      {children}
    </BlogContext.Provider>
  );
}

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};
