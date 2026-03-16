import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../auth';
import './AdminLayout.css';

const navItems = [
  { to: '/', label: 'Статистика', icon: '📊' },
  { to: '/lobbies', label: 'Лобби', icon: '🎮' },
  { to: '/users', label: 'Пользователи', icon: '👥' },
  { to: '/decks', label: 'Колоды', icon: '🃏' },
];

export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">Liar Admin</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
