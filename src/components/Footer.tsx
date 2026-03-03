import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 mt-20 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://drive.google.com/uc?export=view&id=1GR3WVRGjrPIfC8K9lGaCOPZSJA761djx" 
              alt="MD.Blog Logo" 
              className="h-8 w-auto"
              referrerPolicy="no-referrer"
            />
          </Link>
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            © {new Date().getFullYear()} MD.Blog. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center gap-6 text-slate-400 dark:text-slate-600">
          <a href="#" className="hover:text-orange-500 transition-colors" aria-label="Twitter">
            <Twitter size={20} />
          </a>
          <a href="#" className="hover:text-orange-500 transition-colors" aria-label="GitHub">
            <Github size={20} />
          </a>
          <a href="#" className="hover:text-orange-500 transition-colors" aria-label="LinkedIn">
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
