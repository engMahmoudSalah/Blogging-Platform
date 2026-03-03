import { useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { PostForm } from '../components/PostForm';

export function CreatePost() {
  const { addPost } = useBlog();
  const navigate = useNavigate();

  const handleSubmit = (title: string, content: string, tags: string[], coverImage?: string, featured?: boolean) => {
    addPost(title, content, tags, coverImage, featured);
    navigate('/');
  };

  return <PostForm onSubmit={handleSubmit} />;
}
