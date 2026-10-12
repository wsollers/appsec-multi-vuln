import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/suppliers', label: 'Suppliers' },
  { to: '/customers', label: 'Customers' },
  { to: '/employees', label: 'Employees' },
  { to: '/shippers', label: 'Shippers' },
  { to: '/orders', label: 'Orders' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-700 text-white shadow">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">Northwind Admin</span>
            <span className="rounded bg-brand-600 px-2 py-0.5 text-xs">secure baseline</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user && (
              <>
                <span className="opacity-90">
                  {user.username} ({user.roles.join(', ')})
                </span>
                <button
                  className="rounded bg-white/15 px-3 py-1 hover:bg-white/25"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <nav className="mb-6 flex flex-wrap gap-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>

      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
        Northwind reference application — secured baseline
      </footer>
    </div>
  );
}
