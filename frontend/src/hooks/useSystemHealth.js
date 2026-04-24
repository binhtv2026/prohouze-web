/**
 * useSystemHealth.js — E10
 * Production health monitoring: API, Supabase, SW, Network, Performance
 */
import { useQuery } from '@/lib/reactQuery';
import { api } from '@/lib/api';

// ─── E10: System Health Dashboard hook ────────────────────────────────────────
export const useSystemHealth = () =>
  useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const checks = await Promise.allSettled([
        checkAPIServer(),
        checkSupabase(),
        checkNetwork(),
        checkServiceWorker(),
        checkPerformance(),
      ]);

      const [apiCheck, supabaseCheck, networkCheck, swCheck, perfCheck] = checks.map(r =>
        r.status === 'fulfilled' ? r.value : { healthy: false, error: r.reason?.message }
      );

      const allHealthy = [apiCheck, supabaseCheck, networkCheck].every(c => c.healthy);

      return {
        overall: allHealthy ? 'healthy' : supabaseCheck.healthy && networkCheck.healthy ? 'degraded' : 'down',
        timestamp: new Date().toISOString(),
        services: {
          api:          apiCheck,
          supabase:     supabaseCheck,
          network:      networkCheck,
          serviceWorker: swCheck,
          performance:  perfCheck,
        },
      };
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
    retry: false,
  });

// ─── Individual checks ─────────────────────────────────────────────────────────
async function checkAPIServer() {
  const start = Date.now();
  try {
    const res = await api.get('/health', { timeout: 5000 });
    return {
      healthy: res.status === 200,
      latency: Date.now() - start,
      version: res.data?.version,
      status: res.data?.status,
    };
  } catch (err) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: err.code === 'ECONNABORTED' ? 'timeout' : err.message,
    };
  }
}

async function checkSupabase() {
  const start = Date.now();
  try {
    const { checkSupabaseConnection } = await import('@/lib/supabaseClient');
    const result = await checkSupabaseConnection();
    return {
      healthy: result.connected,
      latency: Date.now() - start,
      error: result.error,
    };
  } catch (err) {
    return { healthy: false, latency: Date.now() - start, error: err.message };
  }
}

async function checkNetwork() {
  return {
    healthy: navigator.onLine,
    type: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink,
    saveData: navigator.connection?.saveData || false,
  };
}

async function checkServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return { healthy: false, reason: 'not_supported' };
  }
  const regs = await navigator.serviceWorker.getRegistrations();
  return {
    healthy: regs.length > 0,
    registrations: regs.length,
    state: regs[0]?.active?.state || 'none',
  };
}

async function checkPerformance() {
  if (!('performance' in window)) return { healthy: true };
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav) return { healthy: true };

  const ttfb = nav.responseStart - nav.requestStart;
  const domLoad = nav.domContentLoadedEventEnd - nav.navigationStart;
  const pageLoad = nav.loadEventEnd - nav.navigationStart;

  return {
    healthy: ttfb < 2000 && pageLoad < 5000,
    ttfb: Math.round(ttfb),
    dom_load_ms: Math.round(domLoad),
    page_load_ms: Math.round(pageLoad),
  };
}

// ─── Simple status badge hook (for header/sidebar) ────────────────────────────
export const useSystemStatusBadge = () => {
  const { data } = useSystemHealth();
  if (!data) return { status: 'loading', color: 'bg-slate-400' };
  return {
    status: data.overall,
    color: {
      healthy:  'bg-emerald-500',
      degraded: 'bg-amber-500',
      down:     'bg-red-500',
      loading:  'bg-slate-400',
    }[data.overall] || 'bg-slate-400',
    label: {
      healthy:  'Tất cả hệ thống hoạt động',
      degraded: 'Một số dịch vụ gián đoạn',
      down:     'Hệ thống đang có sự cố',
    }[data.overall] || '',
  };
};

// ─── SW registration helper ────────────────────────────────────────────────────
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;
  if (process.env.NODE_ENV !== 'production') return;

  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for SW updates
    });

    // Background sync registration
    if ('sync' in reg) {
      await reg.sync.register('sync-offline-actions').catch(() => {});
    }

    // Handle SW update available
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available — notify user
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    });

    console.log('[SW] Registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
  }
};
