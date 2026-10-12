import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './lib/auth';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('App routing & auth guard', () => {
  it('renders the login page with demo accounts', () => {
    renderAt('/login');
    expect(screen.getByText('Northwind Admin')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText(/read-only/)).toBeInTheDocument();
  });

  it('redirects an unauthenticated user away from a protected route to login', () => {
    renderAt('/products');
    // The login heading is present because RequireAuth redirected to /login.
    expect(screen.getByText('Secure reference application')).toBeInTheDocument();
  });
});
