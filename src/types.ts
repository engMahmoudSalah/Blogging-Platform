export interface Author {
  name: string;
  avatar: string;
  bio?: string;
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
}
