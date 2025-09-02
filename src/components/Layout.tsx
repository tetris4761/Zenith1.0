import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

// Simplified navigation type for now
type NavigationItem = 'dashboard' | 'documents' | 'flashcards' | 'tasks' | 'focus' | 'calendar' | 'analytics';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = (location.pathname.split('/')[1] || 'dashboard') as NavigationItem;

  const handleNavigation = (item: NavigationItem) => {
    navigate(`/${item === 'dashboard' ? '' : item}`);
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
