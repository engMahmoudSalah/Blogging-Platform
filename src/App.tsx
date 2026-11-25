/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { BlogProvider } from './context/BlogContext';
import { AuthProvider } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreatePost } from './pages/CreatePost';
import { EditPost } from './pages/EditPost';
import { PostDetail } from './pages/PostDetail';
import { AnimatePresence } from 'motion/react';

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
              </Route>
            </Routes>
          </AnimatePresence>
        </Router>
      </BlogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
