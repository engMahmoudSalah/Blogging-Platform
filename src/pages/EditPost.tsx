import { useParams, useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { PostForm } from '../components/PostForm';

export function EditPost() {
  const { id } = useParams<{ id: string }>();
  const { getPost, updatePost } = useBlog();
  const navigate = useNavigate();

  const post = id ? getPost(id) : undefined;

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Post not found</h2>
        <button onClick={() => navigate('/')} className="text-indigo-500 hover:text-indigo-600 font-medium">
          Return to Home
        </button>
      </div>
    );
  }

  const handleSubmit = (title: string, content: string, tags: string[], coverImage?: string, featured?: boolean) => {
    updatePost(post.id, title, content, tags, coverImage, featured);
    navigate(`/post/${post.id}`);
  };

  return (
    <PostForm
      initialData={{ 
        title: post.title, 
        content: post.content, 
        tags: post.tags,
        coverImage: post.coverImage,
        featured: post.featured
      }}
      onSubmit={handleSubmit}
      isEditing
    />
  );
}
