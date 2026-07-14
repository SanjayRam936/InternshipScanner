import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const NAV_ITEMS = [
  {
    label: 'SCANNER',
    to: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="0" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    label: 'GALLERY',
    to: '/gallery',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'HISTORY',
    to: '/history',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    label: 'SETTINGS',
    to: '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

const BottomNav = () => (
  <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
    {NAV_ITEMS.map(({ label, to, icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          `bottom-nav-item${isActive ? ' bottom-nav-item--active' : ''}`
        }
      >
        <span className="bottom-nav-icon">{icon}</span>
        <span className="bottom-nav-label">{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
