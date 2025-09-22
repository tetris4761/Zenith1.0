import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CollapsibleSidebar from './CollapsibleSidebar';
import TopBar from './TopBar';
import { useState, useEffect } from 'react';

// Simplified navigation type for now
type NavigationItem = 'dashboard' | 'documents' | 'flashcards' | 'tasks' | 'focus' | 'calendar' | 'analytics';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const currentPage = (location.pathname.split('/')[1] || 'dashboard') as NavigationItem;

  const handleNavigation = (item: NavigationItem) => {
    navigate(`/${item === 'dashboard' ? '' : item}`);
  };

  const handleSidebarToggle = (expanded: boolean) => {
    setSidebarExpanded(expanded);
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <CollapsibleSidebar 
        activeItem={currentPage} 
        onItemClick={handleNavigation} 
        onToggle={handleSidebarToggle} 
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'ml-48' : 'ml-16'
      }`}>
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
