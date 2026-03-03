/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { BlogProvider } from './context/BlogContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreatePost } from './pages/CreatePost';
import { EditPost } from './pages/EditPost';
import { PostDetail } from './pages/PostDetail';
import { AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <ThemeProvider>
      <BlogProvider>
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="create" element={<CreatePost />} />
                <Route path="edit/:id" element={<EditPost />} />
                <Route path="post/:id" element={<PostDetail />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </Router>
      </BlogProvider>
    </ThemeProvider>
  );
}
