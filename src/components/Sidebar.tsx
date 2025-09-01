import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Timer, 
  Calendar, 
  BarChart3,
  ChevronDown,
  FolderOpen,
  Plus,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';

// Simplified navigation type for now
type NavigationItem = 'dashboard' | 'documents' | 'flashcards' | 'tasks' | 'focus' | 'calendar' | 'analytics';

interface SidebarProps {
  currentPage: NavigationItem;
  onNavigate: (item: NavigationItem) => void;
}

const navigationItems = [
  { id: 'dashboard' as NavigationItem, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents' as NavigationItem, label: 'Documents', icon: FileText },
  { id: 'flashcards' as NavigationItem, label: 'Flashcards', icon: BookOpen },
  { id: 'tasks' as NavigationItem, label: 'Tasks', icon: CheckSquare },
  { id: 'focus' as NavigationItem, label: 'Focus', icon: Timer },
  { id: 'calendar' as NavigationItem, label: 'Calendar', icon: Calendar },
  { id: 'analytics' as NavigationItem, label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [foldersExpanded, setFoldersExpanded] = useState(false);

  return (
    <div className="w-64 bg-primary-800 text-white flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <h1 className="text-2xl font-bold text-white">Zenith</h1>
        <p className="text-sm text-primary-200">Study Smarter</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200',
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5',
                    isActive ? 'text-blue-400' : 'text-primary-300'
                  )} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Folders Section */}
      <div className="p-4 border-t border-primary-700">
        <button
          onClick={() => setFoldersExpanded(!foldersExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-primary-200 hover:text-white hover:bg-primary-700 transition-colors rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <FolderOpen className="w-5 h-5" />
            <span className="font-medium">Folders</span>
          </div>
          <ChevronDown className={cn('w-4 h-4 transition-transform', foldersExpanded && 'rotate-180')} />
        </button>
        
        {foldersExpanded && (
          <div className="mt-2 space-y-1">
            <div className="px-3 py-1 text-sm text-primary-300">📚 Study Notes</div>
            <div className="px-3 py-1 text-sm text-primary-300">📝 Essays</div>
            <div className="px-3 py-1 text-sm text-primary-300">🔬 Research</div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-primary-700">
        <div className="flex space-x-2">
          <button className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md">
            <Plus className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md">
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
