import { Globe, FileCheck2, Smartphone, Video, KanbanSquare, Gem, Briefcase, Feather, Bookmark, ChefHat, ShieldCheck, CalendarDays, ListTodo, Building2, Wand2, Blocks, GraduationCap, Droplets, KeyRound } from 'lucide-react';

const SITES = [
  ['MD Portfolio', Globe, 'https://md.mahmodsalah.workers.dev/'],
  ['German File Kit', FileCheck2, 'https://german-file-kit.mahmodsalah.workers.dev/'],
  ['SIM Services', Smartphone, 'https://sim-service.mahmodsalah.workers.dev/'],
  ['Meetly', Video, 'https://meetly.mahmodsalah.workers.dev/'],
  ['Velocity Workspace', KanbanSquare, 'https://project-manageiment-tool-9014.ai.studio/'],
  ['Fakhama Luxury Store', Gem, 'https://fakhama.mahmodsalah.workers.dev/'],
  ['WASLA', Briefcase, 'https://wasla.mahmodsalah.workers.dev/'],
  ['Quill', Feather, 'https://blogging-platform.mahmodsalah.workers.dev/'],
  ['Stash', Bookmark, 'https://stools.mahmodsalah.workers.dev/'],
  ['Naturix', ChefHat, 'https://naturix.mahmodsalah.workers.dev/'],
  ['TaqwaShield AI', ShieldCheck, 'https://taqwa-shield-ai.mahmodsalah.workers.dev/'],
  ['AI Summit', CalendarDays, 'https://event-page.mahmodsalah.workers.dev/'],
  ['Orbit Tasks', ListTodo, 'https://to-do-list.mahmodsalah.workers.dev/'],
  ['Aqar Real Estate', Building2, 'https://real-state.mahmodsalah.workers.dev/'],
  ['Magic Convertor', Wand2, 'https://magic-convertor.mahmodsalah.workers.dev/'],
  ['Children Skills', Blocks, 'https://children-skills.mahmodsalah.workers.dev/'],
  ['Foda Salama', GraduationCap, 'https://foda-salama.mahmodsalah.workers.dev/'],
  ['Right Water', Droplets, 'https://right-water.mahmodsalah.workers.dev/'],
  ['Login Sahl', KeyRound, 'https://login-sahl.mahmodsalah.workers.dev/'],
] as const;

export function SiteDock({ current = 'Quill' }: { current?: string }) {
  return (
    <nav aria-label="All sites by Mahmoud Salah" className="border-t border-slate-200 dark:border-slate-800 pt-6 pb-2 w-full">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 text-center sm:text-left">More from Mahmoud Salah</p>
      <ul className="flex flex-wrap justify-center sm:justify-start gap-2">
        {SITES.map(([name, Icon, url]) => {
          const on = name === current;
          return (
            <li key={name}>
              <a href={url} title={name} aria-label={name} aria-current={on ? 'page' : undefined} target={on ? undefined : '_blank'} rel="noopener"
                className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${on ? 'bg-orange-600 border-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400'}`}>
                <Icon size={18} aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
