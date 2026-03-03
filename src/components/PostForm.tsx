import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Save, X, Plus, Image as ImageIcon, Star, Upload } from 'lucide-react';
import ReactQuill from 'react-quill-new';

interface PostFormProps {
  initialData?: {
    title: string;
    content: string;
    tags: string[];
    coverImage?: string;
    featured?: boolean;
  };
  onSubmit: (title: string, content: string, tags: string[], coverImage?: string, featured?: boolean) => void;
  isEditing?: boolean;
}

export function PostForm({ initialData, onSubmit, isEditing = false }: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'blockquote', 'code-block'],
      ['clean']
    ],
  };

  useEffect(() => {
    if (!isEditing) {
      titleInputRef.current?.focus();
    }
  }, [isEditing]);

  const validate = () => {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.trim() || content === '<p><br></p>') newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(title.trim(), content.trim(), tags, coverImage.trim() || undefined, featured);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e as React.KeyboardEvent).key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto space-y-8 py-12 px-4 sm:px-6 lg:px-8 pt-32"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-orange-500/25"
          >
            <Save size={18} />
            {isEditing ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Title
          </label>
          <input
            ref={titleInputRef}
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
            placeholder="Enter a captivating title..."
            className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border ${
              errors.title ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
            } rounded-2xl text-slate-900 dark:text-white text-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none`}
          />
          {errors.title && <p className="mt-2 text-sm text-red-500 font-medium">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="coverImage" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={16} />
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Upload size={16} />
              Or Upload Local Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
            />
          </div>
        </div>

        {coverImage && (
          <div className="relative w-full h-48 sm:h-64 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setCoverImage('')}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="p-0.5 hover:bg-orange-500/20 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tags (press Enter)"
              className="flex-grow px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl transition-colors flex items-center gap-2 font-bold"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 bg-slate-50/80 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-5 h-5 text-orange-500 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-orange-500 bg-white dark:bg-slate-800"
          />
          <label htmlFor="featured" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest cursor-pointer">
            <Star size={18} className={featured ? "fill-orange-500 text-orange-500" : "text-slate-400"} />
            Feature this post
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Content
          </label>
          <div className={`bg-white dark:bg-slate-900 border ${errors.content ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-3xl overflow-hidden`}>
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={(val) => {
                setContent(val);
                if (errors.content) setErrors({ ...errors, content: undefined });
              }} 
              modules={modules}
              className="h-96 text-slate-900 dark:text-white"
            />
          </div>
          {errors.content && <p className="mt-12 text-sm text-red-500 font-medium">{errors.content}</p>}
        </div>
      </div>
    </motion.form>
  );
}
