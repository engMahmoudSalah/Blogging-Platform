import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthMenu() {
  const { user, loading, logout } = useAuth();
  if (loading) return null;
  const cls = 'text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 px-2 py-1';
  if (!user) return (<span className="flex items-center gap-1"><Link to="/login" className={cls}>Sign in</Link><Link to="/signup" className="text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-full">Sign up</Link></span>);
  return (<span className="flex items-center gap-1"><Link to="/dashboard" className={cls}>@{user.handle}</Link><button onClick={logout} className={cls}>Log out</button></span>);
}
