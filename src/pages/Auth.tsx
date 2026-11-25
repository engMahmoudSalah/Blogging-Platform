import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const next = new URLSearchParams(loc.search).get('next') || '/dashboard';
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (signup) await register(name, handle, email, password); else await login(email, password);
      navigate(next);
    } catch (err: any) { setError(err.message || 'Something went wrong'); }
    setBusy(false);
  };
  const field = 'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500';
  return (
    <div className="max-w-md mx-auto px-4 pt-36 pb-20">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{signup ? 'Start your blog' : 'Welcome back'}</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">{signup ? 'Free plan: up to 25 posts, drafts, scheduling, comments and RSS.' : 'Sign in to write, schedule and manage your posts.'}</p>
      <form onSubmit={submit} className="space-y-4" aria-label={signup ? 'Create account' : 'Sign in'}>
        {signup && (
          <>
            <label className="block"><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name</span>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
            <label className="block"><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Handle (your blog address)</span>
              <input className={field} value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} pattern="[a-z0-9_-]{3,20}" title="3-20 letters, numbers, - or _" autoComplete="username" required /></label>
          </>
        )}
        <label className="block"><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</span>
          <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label className="block"><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</span>
          <input className={field} type="password" minLength={signup ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} required /></label>
        {error && <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-60">{busy ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        {signup ? <>Already have an account? <Link className="text-orange-600 font-bold" to="/login">Sign in</Link></> : <>New here? <Link className="text-orange-600 font-bold" to="/signup">Create a free account</Link></>}
      </p>
    </div>
  );
}
