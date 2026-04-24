# CHANGELOG — ProHouzing

All notable changes documented per phase.

## [2.1.0] — 2026-04-19 🎯 PRODUCTION LAUNCH

### 🔓 Phase F — Production Launch (10/10 ✅ LOCKED)

#### F1 — Database Migration
- `supabase_migration_phase_f.sql`: notifications, audit_logs, device_tokens tables
- 13 performance indexes, Realtime enabled on 4 tables
- RLS policies: user-own notifications, admin-only audit, user device tokens
- Triggers: auto notify contract expiring (status = expiring_soon)
- Functions: `auto_flag_expiring_contracts()`, `create_notification()`

#### F2 — Production Server
- `production_server.py`: SecurityHeaders, RateLimit, RequestLog middlewares
- Rate limits: auth 20/min, AI 30-50/min, general 200/min
- Health endpoints: `/health`, `/ping`, `/version`, `/metrics/basic`
- Gunicorn config: auto-generated, uvicorn workers, 120s timeout

#### F3 — CI/CD Pipeline
- `.github/workflows/cicd.yml`: 4-job pipeline
- Job 1: Frontend build + size check (50MB limit)
- Job 2: Python syntax + router import validation
- Job 3: Auto Vercel deploy on main push
- Job 4: Post-deploy health check

#### F4 — Monitoring Dashboard
- `SystemHealthPage.jsx`: Real-time health UI, 5 service cards
- Overall status (healthy/degraded/down), animated pulse indicator
- Phase roadmap completion tracker A-F

#### F5 — Bundle Optimization
- Bundle size validation in CI/CD + go-live runbook
- Lazy-load pattern for all optional packages (webpackIgnore)
- Production sourcemap disabled (GENERATE_SOURCEMAP=false)

#### F6 — Security Audit
- Security headers: HSTS, XSS, CSP, X-Content-Type-Options
- .gitignore validation for .env files
- No hardcoded secrets check in go-live runbook
- CORS production whitelist (4 origins)

#### F7 — Load Testing
- `scripts/load-test.sh`: Health, AI endpoints, concurrent 10 users
- RPS measurement, rate limit verification, timeout detection

#### F8 — Go-Live Runbook
- `scripts/go-live-runbook.sh`: 10-step interactive guide
- Pre-flight → Env vars → DB migration → Build → Security → Submit → Deploy → Load test → Tag → Post-launch

#### F9 — Backup & DR
- `scripts/backup-restore.sh`: pg_dump, config backup, manifest JSON
- Rollback mechanism: `git checkout <tag>` với confirm gate

#### F10 — Version Freeze
- Tag: `v1.0-production` — all 6 phases complete
- CHANGELOG.md (this file)

---

## [2.0.0] — 2026-04-19

### 🔓 Phase E — Full Integration (10/10 ✅)
- E1: Supabase client (lazy-load, db.*, storage.*)
- E2: Realtime sync hooks (contracts, listings, notifications, leaderboard)
- E3: Push notifications (Firebase FCM + Capacitor unified)
- E4/E5/E7: Analytics (PostHog), Error monitoring (Sentry), Web Vitals
- E6: Vercel deploy config (Singapore, API proxy, security headers)
- E8: Deep links (15 route mappings, Universal/App Links)
- E9: Service Worker (Cache-First, Network-First, offline fallback)
- E10: System health hooks + registerServiceWorker

### 🔓 Phase D — AI Features (10/10 ✅)
- D1: AI Định giá BĐS (7 factors, confidence, comparables)
- D2: Lead Scoring (5 dimensions → HOT/WARM/COOL/COLD)
- D3: AI Chat (FAQ engine, typing animation, quick actions)
- D4: Deal Prediction (win probability, risk signals)
- D5: Smart Notifications (priority scheduler)
- D6: Content Generator (3 templates: listing, email, Zalo)
- D7: Product Recommendation (5-factor matching)
- D8: KPI Coaching (gap analysis, training suggestions)
- D9: Sentiment Analysis (keyword-based, urgent detection)
- D10: AI Dashboard (command center, 8 feature grid)

### 🔓 Phase C — Native App (10/10 ✅)
- C1: Safe area CSS, iOS/Android body classes, keyboard handler
- C2: Haptic feedback (6 levels), pull-to-refresh, swipe-back
- C3: App Store config (com.prohouzing.app v2.1.0)
- C4: Screenshot metadata (6 screens × 3 App Store + 2 Play sizes)
- C5: Privacy Policy + Terms of Service
- C6: iOS build script (archive → IPA → altool)
- C7: Android build script (gradlew → AAB → sign)
- C8/C9: App Store + Play Store submission
- C10: Submission checklist + 10 npm scripts

### 🔓 Phase B — Data Layer (10/10 ✅)
- B1: Secondary Sales router (listings, deals, valuation)
- B2: Leasing router (assets, contracts, maintenance, invoices)
- B3: HR Development router (career, badges, competition, training)
- B4: useSecondary.js React hooks
- B5: useLeasing.js (realtime contract expiry alerts)
- B6: useHRDev.js (career, badges, leaderboard)
- B7: File upload hook (multipart, progress)
- B8: Offline cache (localStorage, 30min TTL)
- B9: Auto invoice generation
- B10: Supabase SQL schema (10 tables, RLS, indexes, triggers)

---

## [1.0.0] — 2026-04-18

### 🔓 Phase A — Foundation (10/10 ✅)
- Module selection (/select-module: Primary/Secondary/Leasing)
- Role-based access control
- Mobile-first design (Tailwind + CSS)
- CareerPath, Competition, TrainingHub pages
- Sales: SalesProjectsPage, FloorPlanPage, SalesDashboard
- Leasing: Assets, Contracts, Maintenance, Invoices
- Auth flow: Login → Module select → Role-based redirect
- Git: v1.0-phase-a tag
