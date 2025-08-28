import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  ListTodo, 
  Target, 
  Calendar, 
  BarChart3,
  Plus,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { NavigationItem } from '../types';

interface SidebarProps {
  currentPage: NavigationItem;
  onNavigate: (item: NavigationItem) => void;
}

const navigationItems = [
  { id: 'dashboard' as NavigationItem, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents' as NavigationItem, label: 'Documents', icon: FileText },
  { id: 'review' as NavigationItem, label: 'Review', icon: CheckCircle },
  { id: 'tasks' as NavigationItem, label: 'Tasks', icon: ListTodo },
  { id: 'focus' as NavigationItem, label: 'Focus', icon: Target },
  { id: 'calendar' as NavigationItem, label: 'Calendar', icon: Calendar },
  { id: 'analytics' as NavigationItem, label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="w-64 bg-primary-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <h1 className="text-2xl font-bold">Zenith</h1>
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
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-primary-700">
        <div className="flex space-x-2">
          <button className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors duration-200">
            <Plus className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors duration-200">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
