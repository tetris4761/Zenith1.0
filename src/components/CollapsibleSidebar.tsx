import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Clock, 
  Calendar, 
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CollapsibleSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  onToggle?: (expanded: boolean) => void;
  children?: React.ReactNode;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'focus', label: 'Focus', icon: Clock },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function CollapsibleSidebar({ activeItem, onItemClick, onToggle, children }: CollapsibleSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsExpanded(true);
    onToggle?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsExpanded(false);
    onToggle?.(false);
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 transition-all duration-300 ease-in-out z-30',
        isExpanded ? 'w-48' : 'w-16'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-center">
          {isExpanded ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Zenith</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  'w-full flex items-center rounded-lg transition-all duration-200 group relative',
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                )}
              >
                <div className={cn(
                  'flex items-center transition-all duration-200',
                  isExpanded ? 'px-3 py-2 space-x-2' : 'p-2 justify-center'
                )}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </div>
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Content (if any) */}
      {children && (
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      )}

      {/* Expand/Collapse Indicator */}
      <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
        <div className={cn(
          'w-6 h-6 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm transition-all duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          {isExpanded ? (
            <ChevronLeft className="w-3 h-3 text-neutral-600" />
          ) : (
            <ChevronRight className="w-3 h-3 text-neutral-600" />
          )}
        </div>
      </div>
    </div>
  );
}
