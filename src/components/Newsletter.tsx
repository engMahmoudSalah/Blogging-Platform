import { Mail } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || busy) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api<{ already?: boolean }>('/public/subscribe', { method: 'POST', body: { email, website } });
      setSubscribed(true); setEmail('');
      setMsg({ ok: true, text: r.already ? 'You are already on the list. Thanks!' : 'You are in! We will email you new posts.' });
    } catch (err: any) {
      setMsg({ ok: false, text: err.message === 'Request failed' ? 'Could not subscribe right now. Try again in a moment.' : err.message });
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl dark:shadow-slate-900/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="relative z-10">
        <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-5 sm:mb-8 text-white shadow-lg shadow-orange-500/25">
          <Mail size={28} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Stay in the loop
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
          Get the latest insights on AI automation and agency building delivered right to your inbox.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4" aria-label="Newsletter signup">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            aria-label="Email address"
            autoComplete="email"
            className="flex-grow min-w-0 w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:outline-none transition-all"
          />
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <button
            type="submit"
            disabled={busy}
            className="px-8 py-3.5 sm:py-4 disabled:opacity-60 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/25 whitespace-nowrap"
          >
            {busy ? 'Joining...' : subscribed ? 'Subscribed!' : 'Join Now'}
          </button>
        </form>
        {msg && <p role="status" className={`mt-4 text-sm font-medium ${msg.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
