import type { Page } from '../App';
import './Sidebar.css';

interface NavItem {
  id: Page;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'operations', label: 'Operations', icon: '⚙' },
  { id: 'fleet', label: 'Fleet', icon: '◉' },
  { id: 'alerts', label: 'Alerts', icon: '⚠' },
  { id: 'settings', label: 'Settings', icon: '⊙' },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">▲</span>
        <span className="logo-text">DRONIC</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-indicator">
          <span className="status-dot online" />
          <span className="status-text">System Online</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
