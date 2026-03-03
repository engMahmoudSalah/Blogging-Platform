import { Mail } from 'lucide-react';
import { useState } from 'react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl dark:shadow-slate-900/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="relative z-10">
        <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg shadow-orange-500/25">
          <Mail size={28} />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Stay in the loop
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed">
          Get the latest insights on AI automation and agency building delivered right to your inbox.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-grow px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/25 whitespace-nowrap"
          >
            {subscribed ? 'Subscribed!' : 'Join Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
