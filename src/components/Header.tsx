import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Plus, Search, AlertCircle, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBlog } from '../context/BlogContext';
import { useTheme } from '../context/ThemeContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery, storageError, setStorageError } = useBlog();
  const location = useLocation();

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <AnimatePresence>
        {storageError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white overflow-hidden shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <p className="text-xs sm:text-sm font-medium">
                  Storage full. Changes might not be saved. Try deleting old posts.
                </p>
              </div>
              <button 
                onClick={() => setStorageError(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img 
              src="https://drive.google.com/uc?export=view&id=1GR3WVRGjrPIfC8K9lGaCOPZSJA761djx" 
              alt="MD.Blog Logo" 
              className="h-9 w-auto hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-grow max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, tags, content..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-100 dark:border-none rounded-full text-sm focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2.5 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-500 transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full"
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ y: -20, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 20, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
            <Link
              to="/create"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
            >
              <Plus size={18} />
              <span>Write</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-8 space-y-6">
              {/* Mobile Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-base focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </div>

              <Link
                to="/create"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 w-full bg-orange-500 text-white px-4 py-4 rounded-2xl font-bold justify-center shadow-lg shadow-orange-500/20"
              >
                <Plus size={18} />
                <span>Create Post</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  </div>
  );
}
