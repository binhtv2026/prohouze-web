/**
 * analytics.js — E4
 * Custom analytics layer + PostHog/Mixpanel ready integration
 * E4: Event tracking | E5: Error monitoring (Sentry-compatible)
 * E7: Web Vitals performance monitoring
 */

// ─── E4: Analytics core ───────────────────────────────────────────────────────
const ANALYTICS_ENABLED = process.env.REACT_APP_ANALYTICS_ENABLED !== 'false';
const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || 'https://app.posthog.com';

let _posthog = null;
let _sentry = null;

// Event queue cho offline
const eventQueue = [];

// ─── Init ─────────────────────────────────────────────────────────────────────
export const initAnalytics = async (user = null) => {
  if (!ANALYTICS_ENABLED) return;

  // PostHog
  if (POSTHOG_KEY) {
    try {
      const { default: posthog } = await import('posthog-js').catch(() => ({ default: null }));
      if (posthog) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          autocapture: false,
          capture_pageview: false,
          persistence: 'localStorage',
          loaded: (ph) => {
            _posthog = ph;
            if (user) {
              ph.identify(user.id, {
                email: user.email,
                name: user.full_name,
                role: user.role,
              });
            }
          },
        });
      }
    } catch {}
  }

  // Sentry (E5)
  const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
  if (SENTRY_DSN) {
    try {
      const Sentry = await import('@sentry/react').catch(() => null);
      if (Sentry) {
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: process.env.NODE_ENV,
          release: `prohouzing@2.1.0`,
          tracesSampleRate: 0.2,
          integrations: [new Sentry.BrowserTracing()],
        });
        _sentry = Sentry;
        if (user) {
          Sentry.setUser({ id: user.id, email: user.email, role: user.role });
        }
      }
    } catch {}
  }

  // Flush queued events
  eventQueue.splice(0).forEach(e => track(e.name, e.props));
};

// ─── E4a: Track screen view ───────────────────────────────────────────────────
export const trackPage = (path, title = '') => {
  if (!ANALYTICS_ENABLED) return;
  const props = { path, title, timestamp: new Date().toISOString(), platform: getPlatform() };
  if (_posthog) _posthog.capture('$pageview', { $current_url: path, ...props });
  consoleLog('📍 Page:', path);
};

// ─── E4b: Track custom event ──────────────────────────────────────────────────
export const track = (eventName, properties = {}) => {
  if (!ANALYTICS_ENABLED) return;
  const enriched = {
    ...properties,
    timestamp: new Date().toISOString(),
    platform: getPlatform(),
    app_version: '2.1.0',
  };
  if (_posthog) {
    _posthog.capture(eventName, enriched);
  } else {
    eventQueue.push({ name: eventName, props: enriched });
  }
  consoleLog('📊 Track:', eventName, enriched);
};

// Pre-defined events
export const Analytics = {
  // Auth
  login:        (role)    => track('user_login', { role }),
  logout:       ()        => track('user_logout'),

  // Sales
  dealCreated:  (project, value) => track('deal_created', { project, value }),
  dealUpdated:  (stage, prev)    => track('deal_stage_updated', { stage, prev_stage: prev }),
  dealWon:      (value, project) => track('deal_won', { value, project }),

  // Leasing
  contractCreated: (rent)   => track('contract_created', { monthly_rent: rent }),
  invoicePaid:     (amount) => track('invoice_paid', { amount }),
  maintenanceNew:  (prio)   => track('maintenance_ticket_created', { priority: prio }),

  // AI
  valuationRun:    (project, result) => track('ai_valuation_used', { project, confidence: result?.confidence }),
  leadScored:      (tier, score)     => track('ai_lead_scored', { tier, score }),
  contentGenerated:(type)            => track('ai_content_generated', { template_type: type }),
  chatMessage:     ()                => track('ai_chat_message_sent'),

  // Navigation
  moduleSelected: (module) => track('module_selected', { module }), // primary/secondary/leasing
  featureUsed:    (feature) => track('feature_used', { feature }),

  // Training
  courseStarted:    (courseId) => track('training_course_started', { course_id: courseId }),
  courseCompleted:  (courseId) => track('training_course_completed', { course_id: courseId }),
};

// ─── E5: Error tracking ───────────────────────────────────────────────────────
export const captureError = (error, context = {}) => {
  const errorInfo = {
    message: error?.message || String(error),
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    platform: getPlatform(),
  };

  if (_sentry) {
    _sentry.withScope(scope => {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      _sentry.captureException(error);
    });
  }

  // Always log in dev
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error captured:', errorInfo);
  }
};

export const captureMessage = (message, level = 'info', context = {}) => {
  if (_sentry) _sentry.captureMessage(message, level);
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔵 [${level}]`, message, context);
  }
};

// ─── E7: Web Vitals ───────────────────────────────────────────────────────────
export const initWebVitals = async () => {
  try {
    const { getCLS, getFID, getLCP, getFCP, getTTFB } = await import('web-vitals').catch(() => ({}));
    if (!getCLS) return;

    const send = (metric) => {
      track(`web_vital_${metric.name.toLowerCase()}`, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        rating: metric.rating,
      });
    };

    getCLS(send);
    getFID(send);
    getLCP(send);
    getFCP(send);
    getTTFB(send);
  } catch {}
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPlatform = () => {
  if (typeof window === 'undefined') return 'ssr';
  const cap = window.Capacitor;
  if (!cap) return 'web';
  return cap.getPlatform?.() || 'native';
};

const consoleLog = (...args) => {
  if (process.env.NODE_ENV === 'development') console.log(...args);
};
