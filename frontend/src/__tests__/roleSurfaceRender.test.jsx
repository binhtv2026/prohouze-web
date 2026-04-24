import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoleWorkspacePage from '@/pages/RoleWorkspacePage';
import AppHomePage from '@/pages/App/AppHomePage';
import AppModulePage from '@/pages/App/AppModulePage';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_ORDER } from '@/config/roleGovernance';
import { APP_RUNTIME_ROLES, getRoleAppRuntime } from '@/config/appRuntimeShell';
import { roleWorkspaceConfig } from '@/config/roleWorkspaceUx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-router-dom', () => {
  const React = require('react');

  const getPathname = () => globalThis.__TEST_ROUTER_PATHNAME__ || '/';
  const getSectionKey = () => {
    const pathname = getPathname();
    if (!pathname.startsWith('/app/')) {
      return undefined;
    }
    return pathname.replace('/app/', '').split('?')[0] || undefined;
  };

  return {
    MemoryRouter: ({ initialEntries = ['/'], children }) => {
      globalThis.__TEST_ROUTER_PATHNAME__ = initialEntries[0] || '/';
      return React.createElement(React.Fragment, null, children);
    },
    Routes: ({ children }) => React.createElement(React.Fragment, null, children),
    Route: ({ element }) => element,
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    Navigate: ({ to }) => React.createElement('div', { 'data-testid': 'navigate' }, `NAVIGATE:${to}`),
    useParams: () => ({ sectionKey: getSectionKey() }),
  };
}, { virtual: true });

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/layout/PageHeader', () => {
  const React = require('react');
  return function PageHeaderMock({ title, subtitle }) {
    return React.createElement(
      'div',
      { 'data-testid': 'page-header' },
      React.createElement('h1', null, title),
      React.createElement('p', null, subtitle),
    );
  };
});

jest.mock('@/lib/api', () => ({
  dashboardAPI: {
    getStats: jest.fn(() =>
      Promise.resolve({
        data: {
          hot_leads: 5,
          total_leads: 12,
          pending_bookings: 3,
          overdue_tasks: 2,
          monthly_revenue: 530000000,
          daily_revenue: 24000000,
        },
      })),
  },
  projectsAPI: {
    getAll: jest.fn(() => Promise.resolve({ data: { items: [{ id: 1 }, { id: 2 }, { id: 3 }] } })),
  },
}));

jest.mock('@/lib/crmApi', () => ({
  contractsAPI: {
    getStats: jest.fn(() => Promise.resolve({ data: { pending: 2, total_pending: 2, blocked: 1 } })),
  },
  customersAPI: {
    getAll: jest.fn(() => Promise.resolve({ data: { items: [{ id: 1 }, { id: 2 }, { id: 3 }] } })),
  },
  demandsAPI: {
    getAll: jest.fn(() => Promise.resolve({ data: { items: [{ id: 1 }, { id: 2 }] } })),
  },
  leadsAPI: {
    getStats: jest.fn(() =>
      Promise.resolve({
        data: {
          new_leads: 4,
          total_leads: 11,
          hot_leads: 3,
          needs_attention: 2,
        },
      })),
  },
}));

jest.mock('@/lib/salesApi', () => ({
  hardBookingApi: {
    getHardBookings: jest.fn(() => Promise.resolve({ items: [{ id: 1 }] })),
  },
  dealApi: {
    getPipeline: jest.fn(() =>
      Promise.resolve({
        total_deals: 7,
        total_value: 3200000000,
        hot_deals: 2,
        booking_pending: 3,
        won_deals: 1,
        stalled_deals: 2,
        ready_to_close: 1,
      })),
  },
  pricingApi: {
    getPricingPolicies: jest.fn(() => Promise.resolve({ items: [{ id: 1 }, { id: 2 }] })),
    getPromotions: jest.fn(() => Promise.resolve({ items: [{ id: 1 }] })),
  },
  softBookingApi: {
    getSoftBookings: jest.fn(() => Promise.resolve({ items: [{ id: 1 }, { id: 2 }] })),
  },
}));

jest.mock('@/api/pipelineApi', () => ({
  managerApi: {
    getDashboardSummary: jest.fn(() => Promise.resolve({ pipeline_value: 4500000000, overdue_tasks: 3 })),
    getPipelineAnalysis: jest.fn(() =>
      Promise.resolve({
        hot_deals: 2,
        booking_pending: 3,
        won_deals: 1,
        stalled_deals: 2,
        ready_to_close: 1,
        total_value: 4500000000,
      })),
    getApprovalStats: jest.fn(() => Promise.resolve({ pending: 2, approved_today: 1, rejected_today: 1 })),
    getSalesPerformance: jest.fn(() => Promise.resolve({ items: [{ id: 1 }, { id: 2 }, { id: 3 }] })),
    getPendingApprovals: jest.fn(() => Promise.resolve({ total: 4 })),
  },
}));

jest.mock('@/api/marketingV2Api', () => ({
  getMarketingDashboard: jest.fn(() =>
    Promise.resolve({
      data: {
        active_campaigns: [{ id: 1 }, { id: 2 }],
        total_leads: 30,
        top_sources: [{ id: 1 }, { id: 2 }],
        conversion_rate: 8.5,
        paused_campaigns: 1,
      },
    })),
}));

jest.mock('@/api/commissionApi', () => ({
  getMyIncomeWithKPI: jest.fn(() =>
    Promise.resolve({
      income: {
        estimated_amount: 28000000,
        pending_approval_amount: 12000000,
      },
      kpi: {
        overall_achievement: 78,
        bonus_tier: 'Bậc 2',
      },
    })),
}));

jest.mock('@/api/kpiApi', () => ({
  kpiApi: {
    getMyScorecard: jest.fn(() => Promise.resolve({ summary: { total_score: 78, bonus_tier: 'Bậc 2' } })),
    getTeamScorecard: jest.fn(() =>
      Promise.resolve({
        summary: {
          active_members: 8,
          at_risk_members: 2,
          high_performing_teams: 3,
          at_risk_teams: 1,
          top_managers: 2,
        },
      })),
  },
}));

jest.mock('@/api/controlCenterApi', () => ({
  __esModule: true,
  default: {
    getAlertsSummary: jest.fn(() => Promise.resolve({ requires_immediate_action: 2, high_count: 3 })),
    getBottlenecks: jest.fn(() =>
      Promise.resolve({
        bottlenecks: {
          legal: { count: 1 },
          finance: { count: 2 },
        },
      })),
    getExecutiveOverview: jest.fn(() =>
      Promise.resolve({
        quick_metrics: {
          daily_revenue: 24000000,
          monthly_revenue: 530000000,
          total_leads: 40,
        },
        health_score: {
          total_score: 84,
        },
      })),
    getTeamHeatmap: jest.fn(() =>
      Promise.resolve({
        top_teams: 2,
        at_risk_teams: 1,
        top_managers: 2,
        issues_count: 3,
      })),
  },
}));

jest.mock('@/lib/workApi', () => ({
  getManagerWorkload: jest.fn(() => Promise.resolve({ overdue_tasks: 4, overdue_staff: 2 })),
  getOverdueTasks: jest.fn(() => Promise.resolve({ total: 4 })),
}));

const flushEffects = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const settleRender = async (cycles = 4) => {
  for (let index = 0; index < cycles; index += 1) {
    await flushEffects();
  }
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

const setRoleUser = (role) => {
  useAuth.mockReturnValue({
    user: {
      role,
      email: `${role}@prohouze.com`,
      full_name: role,
    },
  });
};

describe('Rendered role surfaces truly support the user in the UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
    globalThis.__TEST_ROUTER_PATHNAME__ = '/';
  });

  test.each(ROLE_ORDER.filter((role) => role !== 'sales'))('%s workspace renders balanced, actionable UI without runtime errors', async (role) => {
    setRoleUser(role);
    const workspace = roleWorkspaceConfig[role];

    const mounted = await renderIntoDom(
      <MemoryRouter initialEntries={['/workspace']}>
        <RoleWorkspacePage />
      </MemoryRouter>,
    );

    await settleRender();

    expect(mounted.container.textContent).toContain(workspace.title);
    expect(mounted.container.textContent).toContain(workspace.queue[0]);
    expect(mounted.container.textContent).toContain('Mở hồ sơ cá nhân');
    expect(mounted.container.textContent).toContain('Lối vào chính');

    const links = Array.from(mounted.container.querySelectorAll('a[href]')).map((node) => node.getAttribute('href'));
    expect(links).toContain('/me');
    expect(links.length).toBeGreaterThanOrEqual(6);

    await mounted.unmount();
  });

  test.each(APP_RUNTIME_ROLES)('%s app home renders actionable stats, alerts and section links', async (role) => {
    setRoleUser(role);
    const runtime = getRoleAppRuntime(role);

    const mounted = await renderIntoDom(
      <MemoryRouter initialEntries={['/app']}>
        <AppHomePage />
      </MemoryRouter>,
    );

    await settleRender();

    expect(mounted.container.textContent).toContain('Hôm nay cần làm gì');
    expect(mounted.container.textContent).toContain(runtime.todayItems[0]);
    expect(mounted.container.textContent).toContain('Mở nhanh để làm việc');
    expect(mounted.container.textContent).toContain('Điểm nóng cần chú ý');
    expect(mounted.container.textContent).toContain('Các khu làm việc chính');

    runtime.quickActions.forEach((action) => {
      expect(mounted.container.textContent).toContain(action.label);
    });

    runtime.tabs.forEach((tab) => {
      expect(mounted.container.textContent).toContain(tab.label);
    });

    const links = Array.from(mounted.container.querySelectorAll('a[href]')).map((node) => node.getAttribute('href'));
    expect(links).toContain(runtime.tabs[0] ? `/app/${runtime.tabs[0].key}` : runtime.homeRoute);
    expect(links.length).toBeGreaterThanOrEqual(10);

    await mounted.unmount();
  });

  test.each(
    APP_RUNTIME_ROLES.flatMap((role) =>
      getRoleAppRuntime(role).tabs.map((tab) => [role, tab.key, tab.heading, tab.primaryAction.label, tab.secondaryActions[0]?.label].filter(Boolean)),
    ),
  )('%s module %s renders primary CTA, support links and focus notes', async (role, sectionKey, heading, primaryActionLabel, firstSecondaryLabel) => {
    setRoleUser(role);

    const mounted = await renderIntoDom(
      <MemoryRouter initialEntries={[`/app/${sectionKey}`]}>
        <Routes>
          <Route path="/app/:sectionKey" element={<AppModulePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await settleRender();

    expect(mounted.container.textContent).toContain(heading);
    expect(mounted.container.textContent).toContain('Đi vào việc chính');
    expect(mounted.container.textContent).toContain(primaryActionLabel);
    if (firstSecondaryLabel) {
      expect(mounted.container.textContent).toContain(firstSecondaryLabel);
    }
    expect(mounted.container.textContent).toContain('Lối vào bổ sung');
    expect(mounted.container.textContent).toContain('Điểm cần chú ý');

    const links = Array.from(mounted.container.querySelectorAll('a[href]')).map((node) => node.getAttribute('href'));
    expect(links.length).toBeGreaterThanOrEqual(3);

    await mounted.unmount();
  });
});
