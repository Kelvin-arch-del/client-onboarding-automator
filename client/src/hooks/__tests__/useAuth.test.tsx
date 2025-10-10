import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import { UserRole } from '../../types/auth';
import { authService } from '../../services/authService';

// Mock the auth service
jest.mock('../../services/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component
const TestComponent: React.FC = () => {
  const { user, login, logout, isAuthenticated, isLoading, hasRole } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user?.name || 'No User'}</div>
      <div data-testid="is-admin">{hasRole(UserRole.ADMIN) ? 'Is Admin' : 'Not Admin'}</div>
      
      <button 
        data-testid="login-btn" 
        onClick={() => login({ email: 'test@test.com', password: 'password' })}
      >
        Login
      </button>
      
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };

    mockAuthService.login.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token',
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('Is Admin');
    });
  });

  it('should handle logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });
});
