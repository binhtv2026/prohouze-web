const normalizePathname = (path = '/') => {
  if (!path) return '/';

  try {
    return new URL(path, 'http://localhost').pathname || '/';
  } catch (_error) {
    return path.split('?')[0] || '/';
  }
};

export const GO_LIVE_ROUTE_PREFIXES = [
  '/login',
  '/dashboard',
  '/workspace',
  '/app',
  '/control',
  '/me',
  '/manager',
  '/sales',
  '/crm',
  '/marketing',
  '/communications',
  '/finance',
  '/commission',
  '/payroll',
  '/hr',
  '/training',
  '/contracts',
  '/legal',
  '/work',
  '/kpi',
  '/cms',
  '/settings',
  '/analytics',
];

export const isPathRegisteredForGoLive = (path = '/') => {
  const pathname = normalizePathname(path);

  return GO_LIVE_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

export const getNormalizedGoLivePath = normalizePathname;
