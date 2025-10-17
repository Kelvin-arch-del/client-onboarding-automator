// client/src/components/__tests__/Header.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Header from '../Header';
import { AuthContext } from '../../auth/AuthProvider';

const mockLogout = vi.fn();
const mockUser = {
  email: 'test@example.com',
  roles: [],
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  sub: '1',
};

const renderWithContext = (contextValue: any) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={contextValue}>
        <Header />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('displays user email and logout button', () => {
    renderWithContext({
      token: 'token',
      user: mockUser,
      login: vi.fn(),
      logout: mockLogout,
      isAuthenticated: true,
      hasRole: () => false,
      hasPermission: () => false,
      loading: false,
      error: null,
      refreshUserProfile: vi.fn(),
    });

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    renderWithContext({
      token: 'token',
      user: mockUser,
      login: vi.fn(),
      logout: mockLogout,
      isAuthenticated: true,
      hasRole: () => false,
      hasPermission: () => false,
      loading: false,
      error: null,
      refreshUserProfile: vi.fn(),
    });

    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('displays Dashboard title', () => {
    renderWithContext({
      token: 'token',
      user: mockUser,
      login: vi.fn(),
      logout: mockLogout,
      isAuthenticated: true,
      hasRole: () => false,
      hasPermission: () => false,
      loading: false,
      error: null,
      refreshUserProfile: vi.fn(),
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
