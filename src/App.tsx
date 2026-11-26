/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { BlogProvider } from './context/BlogContext';
import { AuthProvider } from './context/AuthContext';
import { Link } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreatePost } from './pages/CreatePost';
import { EditPost } from './pages/EditPost';
import { PostDetail } from './pages/PostDetail';
import { AuthorPage } from './pages/AuthorPage';
import { AnimatePresence } from 'motion/react';

function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-28 text-center">
      <p className="text-sm font-bold tracking-[0.3em] text-orange-500">404</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">This page does not exist</h1>
      <p className="mt-3 text-zinc-500">The link may be old or mistyped. Head back to the stories.</p>
      <Link to="/" className="inline-block mt-8 px-6 py-3 rounded-full bg-orange-500 text-white font-bold">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BlogProvider>
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="create" element={<CreatePost />} />
                <Route path="edit/:id" element={<EditPost />} />
                <Route path="post/:id" element={<PostDetail />} />
                <Route path="login" element={<Auth mode="login" />} />
                <Route path="signup" element={<Auth mode="signup" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="author/:handle" element={<AuthorPage notFound={NotFound} />} />
                <Route path=":at" element={<AuthorPage notFound={NotFound} />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </Router>
      </BlogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
