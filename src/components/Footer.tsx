import React from 'react';
import { Link } from 'react-router-dom';
import { Github, User, Linkedin } from 'lucide-react';

// images
import logo from '../Images/logo.jpeg';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 mt-20 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logo}
              alt="MD Logo" 
              className="h-8 w-auto"
              referrerPolicy="no-referrer"
            />
          </Link>
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            © {new Date().getFullYear()} MD MAHMOUD SALAH
          </p>
        </div>
        
        <div className="flex items-center gap-6 text-slate-400 dark:text-slate-600">
          <a href="https://mahmoud-salah-portfolio.netlify.app/" className="hover:text-orange-500 transition-colors" aria-label="Twitter">
            <User size={20} />
          </a>
          <a href="https://github.com/engMahmoudSalah" className="hover:text-orange-500 transition-colors" aria-label="GitHub">
            <Github size={20} />
          </a>
          <a href="https://www.linkedin.com/in/mahmoud-salah-351309208" className="hover:text-orange-500 transition-colors" aria-label="LinkedIn">
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
