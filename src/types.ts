export interface Author {
  name: string;
  avatar: string;
  bio?: string;
  handle?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  readingTime: number;
  createdAt: number;
  updatedAt: number;
  coverImage?: string;
  author: Author;
  likes: number;
  views: number;
  featured?: boolean;
  status?: 'draft' | 'published' | 'scheduled';
  publishAt?: number | null;
  commentCount?: number;
  pendingComments?: number;
}

export interface User {
  id: number;
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  plan: string;
  role: string;
  postCount?: number;
  postLimit?: number;
}
