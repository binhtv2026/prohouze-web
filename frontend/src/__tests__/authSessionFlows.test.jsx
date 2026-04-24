import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MainLayout from '../components/layout/MainLayout';
import { AuthProvider, DEMO_ACCOUNTS, DEMO_PASSWORD, useAuth } from '../contexts/AuthContext';
import { getRoleGoLiveHomePath, isPathInRoleGoLiveScope } from '../config/roleDashboardSpec';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../lib/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('../components/layout/Sidebar', () => {
  const React = require('react');
  return function SidebarMock() {
    return React.createElement('div', { 'data-testid': 'sidebar' }, 'Sidebar');
  };
});

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Navigate: ({ to }) => React.createElement('div', { 'data-testid': 'navigate' }, `NAVIGATE:${to}`),
    Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'OUTLET-READY'),
    useLocation: () => ({ pathname: globalThis.location.pathname }),
  };
}, { virtual: true });

jest.mock('sonner', () => ({
  Toaster: () => null,
}));

const flushEffects = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const renderIntoDom = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  return {
    container,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

function AuthProbe({ capture }) {
  const auth = useAuth();
  capture(auth);
  return <div data-testid="auth-probe">{auth.user?.email || 'anonymous'}</div>;
}

const DEMO_USERS = Object.values(DEMO_ACCOUNTS);

describe('Demo login and session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
  });

  test.each(DEMO_USERS)('logs in and persists session for $email', async (account) => {
    let authSnapshot = null;
    const firstMount = await renderIntoDom(
      <AuthProvider>
        <AuthProbe capture={(value) => { authSnapshot = value; }} />
      </AuthProvider>,
    );

    await flushEffects();

    expect(authSnapshot.loading).toBe(false);

    await act(async () => {
      await authSnapshot.login(account.email, DEMO_PASSWORD);
    });

    await flushEffects();

    expect(authSnapshot.isAuthenticated).toBe(true);
    expect(authSnapshot.user.email).toBe(account.email);
    expect(authSnapshot.user.role).toBe(account.role);
    expect(localStorage.getItem('token')).toBe('local-demo-token');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({
      email: account.email,
      role: account.role,
    });
    expect(isPathInRoleGoLiveScope(account.role, getRoleGoLiveHomePath(account.role))).toBe(true);

    await firstMount.unmount();

    let restoredSnapshot = null;
    const secondMount = await renderIntoDom(
      <AuthProvider>
        <AuthProbe capture={(value) => { restoredSnapshot = value; }} />
      </AuthProvider>,
    );

    await flushEffects();

    expect(restoredSnapshot.loading).toBe(false);
    expect(restoredSnapshot.isAuthenticated).toBe(true);
    expect(restoredSnapshot.user.email).toBe(account.email);
    expect(restoredSnapshot.user.role).toBe(account.role);

    await secondMount.unmount();
  });

  test.each(DEMO_USERS)('keeps $email inside protected layout after rehydrate', async (account) => {
    localStorage.setItem('token', 'local-demo-token');
    localStorage.setItem('user', JSON.stringify(account));

    const homePath = getRoleGoLiveHomePath(account.role);
    window.history.replaceState({}, '', homePath);

    const mounted = await renderIntoDom(
      <AuthProvider>
        <MainLayout />
      </AuthProvider>,
    );

    await flushEffects();

    expect(mounted.container.textContent).toContain('OUTLET-READY');
    expect(mounted.container.textContent).not.toContain('NAVIGATE:/login');

    await mounted.unmount();
  });
});
