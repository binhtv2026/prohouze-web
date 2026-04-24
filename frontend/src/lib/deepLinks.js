/**
 * deepLinks.js — E8
 * Universal Links (iOS) + App Links (Android) + Capacitor deep link handler
 * Route mapping: prohouzing.com/app/... → in-app navigation
 */
import { isNative } from '@/utils/nativeUtils';

// ─── Deep link route mappings ─────────────────────────────────────────────────
const LINK_MAP = [
  // Sales
  { pattern: /\/app\/sales\/project\/(.+)/, route: (m) => `/sales/projects/${m[1]}` },
  { pattern: /\/app\/sales\/deal\/(.+)/,    route: (m) => `/sales/pipeline/${m[1]}` },
  { pattern: /\/app\/booking\/(.+)/,        route: (m) => `/sales/soft-bookings/${m[1]}` },

  // Leasing
  { pattern: /\/app\/lease\/contract\/(.+)/, route: (m) => `/leasing/contracts/${m[1]}` },
  { pattern: /\/app\/lease\/asset\/(.+)/,    route: (m) => `/leasing/assets/${m[1]}` },
  { pattern: /\/app\/lease\/invoice\/(.+)/,  route: (m) => `/leasing/invoices/${m[1]}` },

  // HR
  { pattern: /\/app\/hr\/career/,            route: () => `/hrm/career-path` },
  { pattern: /\/app\/hr\/training/,          route: () => `/hrm/training-hub` },
  { pattern: /\/app\/hr\/competition/,       route: () => `/hrm/competition` },

  // AI
  { pattern: /\/app\/ai\/valuation/,         route: () => `/ai/valuation` },
  { pattern: /\/app\/ai\/chat/,              route: () => `/ai/chat` },

  // Notifications
  { pattern: /\/app\/notification\/(.+)/,    route: (m) => `/notifications/${m[1]}` },

  // Generic
  { pattern: /\/app\/(.+)/,                  route: (m) => `/${m[1]}` },
];

/**
 * Resolve a deep link URL → internal route
 */
export const resolveDeepLink = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;

    for (const mapping of LINK_MAP) {
      const match = path.match(mapping.pattern);
      if (match) {
        return { route: mapping.route(match), params: urlObj.searchParams };
      }
    }
    return { route: '/', params: new URLSearchParams() };
  } catch {
    return null;
  }
};

// ─── Capacitor deep link listener ─────────────────────────────────────────────
export const setupDeepLinkHandler = (navigate) => {
  if (!isNative()) {
    // Web: handle URL params on load
    const url = window.location.href;
    const resolved = resolveDeepLink(url);
    if (resolved && resolved.route !== '/') {
      navigate(resolved.route, { replace: true });
    }
    return null;
  }

  // Capacitor App plugin
  const setup = async () => {
    try {
      const { App } = await import(/* webpackIgnore: true */ '@capacitor/app').catch(() => ({ App: null }));
      if (!App) return null;

      // Handle app opened via deep link
      await App.addListener('appUrlOpen', (event) => {
        const resolved = resolveDeepLink(event.url);
        if (resolved) {
          navigate(resolved.route);
        }
      });

      // Handle URL on initial launch
      const { url } = await App.getLaunchUrl().catch(() => ({ url: null }));
      if (url) {
        const resolved = resolveDeepLink(url);
        if (resolved) navigate(resolved.route, { replace: true });
      }

      return () => App.removeAllListeners();
    } catch {
      return null;
    }
  };

  return setup();
};

// ─── Generate shareable deep links ────────────────────────────────────────────
export const generateDeepLink = (type, id = '') => {
  const BASE = 'https://prohouzing.com/app';
  const routes = {
    project:   `${BASE}/sales/project/${id}`,
    deal:      `${BASE}/sales/deal/${id}`,
    contract:  `${BASE}/lease/contract/${id}`,
    asset:     `${BASE}/lease/asset/${id}`,
    invoice:   `${BASE}/lease/invoice/${id}`,
    valuation: `${BASE}/ai/valuation`,
    chat:      `${BASE}/ai/chat`,
    career:    `${BASE}/hr/career`,
    training:  `${BASE}/hr/training`,
  };
  return routes[type] || BASE;
};

/**
 * Share link natively (Web Share API / Capacitor Share)
 */
export const shareDeepLink = async (type, id, title = 'ProHouze') => {
  const url = generateDeepLink(type, id);
  const shareData = { title, text: `Xem trên ProHouze`, url };

  if (isNative()) {
    try {
      const { Share } = await import(/* webpackIgnore: true */ '@capacitor/share').catch(() => ({ Share: null }));
      if (Share) {
        await Share.share(shareData);
        return;
      }
    } catch {}
  }

  if (navigator.share) {
    try { await navigator.share(shareData); } catch {}
  } else {
    await navigator.clipboard.writeText(url);
  }
};
