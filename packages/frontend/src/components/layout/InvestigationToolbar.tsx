import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  Shield, Network, Clock,
  AlertCircle, HelpCircle, FileText, AlertOctagon
} from 'lucide-react';

const navItems = [
  { name: 'Investigation Board', path: 'board', icon: Network },
  { name: 'Evidence', path: 'evidence', icon: Shield },
  { name: 'Events', path: 'timeline', icon: Clock },
  { name: 'Findings', path: 'findings', icon: AlertCircle },
  { name: 'Questions', path: 'questions', icon: HelpCircle },
  { name: 'Reports', path: 'reports', icon: FileText },
];

export const InvestigationToolbar: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <aside className="w-14 bg-inv-surface border-r border-inv-border flex flex-col shrink-0 items-center py-4 z-50">
      <button onClick={() => navigate('/')} className="mb-6 group" title="Return to Cases">
        <div className="w-8 h-8 rounded bg-inv-red-deep flex items-center justify-center border border-inv-red group-hover:bg-inv-red transition-colors">
          <AlertOctagon size={16} className="text-inv-red-bright group-hover:text-white" />
        </div>
      </button>

      <nav className="flex-1 w-full flex flex-col items-center space-y-2">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={`/cases/${id}/${path}`}
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-md transition-colors group relative ${
                isActive
                  ? 'bg-inv-red-deep/30 text-inv-red-bright border border-inv-red/30'
                  : 'text-inv-muted hover:text-inv-text hover:bg-inv-surface2'
              }`
            }
            title={name}
          >
            <Icon size={18} />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
