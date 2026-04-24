import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src');
const APP_PATH = path.join(ROOT, 'App.js');
const ROUTE_PATTERN = /<Route\s+path="([^"]+)"/g;
const LINK_PATTERN = /(?:to=|href=|navigate\(|path\s*:|link\s*:|viewAllLink\s*:|redirectTo\s*:|defaultPath\s*:|homePath\s*:)\s*["'](\/[^"']*)["']/g;
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const GENERIC_ROUTES_TO_IGNORE = new Set(['/:slug']);

function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const item of items) {
    if (item.name === 'node_modules' || item.name === 'build') {
      continue;
    }

    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (!SOURCE_EXTENSIONS.has(path.extname(item.name))) {
      continue;
    }

    if (item.name.endsWith('.backup.jsx')) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function loadRoutes() {
  const appContent = fs.readFileSync(APP_PATH, 'utf8');
  return new Set([...appContent.matchAll(ROUTE_PATTERN)].map((match) => match[1]));
}

function toRegex(routePath) {
  const escaped = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/:[^/]+/g, '[^/]+')}$`);
}

function audit() {
  const routes = loadRoutes();
  const dynamicRoutes = [...routes].filter((route) => route.includes(':') && !GENERIC_ROUTES_TO_IGNORE.has(route));
  const dynamicRegexes = dynamicRoutes.map((route) => ({ route, regex: toRegex(route) }));
  const missingTargets = new Map();

  for (const filePath of walk(ROOT)) {
    if (filePath === APP_PATH) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const match of content.matchAll(LINK_PATTERN)) {
      const rawTarget = match[1];
      const target = rawTarget.split('?')[0];

      if (target.startsWith('/#')) {
        continue;
      }

      if (routes.has(target)) {
        continue;
      }

      const matchesDynamic = dynamicRegexes.some(({ regex }) => regex.test(target));
      if (matchesDynamic) {
        continue;
      }

      if (!missingTargets.has(target)) {
        missingTargets.set(target, new Set());
      }
      missingTargets.get(target).add(path.relative(process.cwd(), filePath));
    }
  }

  if (missingTargets.size === 0) {
    console.log('OK: no active config/link target without route');
    return 0;
  }

  console.error('Missing internal route targets found:\\n');
  for (const [route, files] of [...missingTargets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.error(route);
    for (const filePath of [...files].sort()) {
      console.error(`  - ${filePath}`);
    }
  }

  return 1;
}

process.exitCode = audit();
