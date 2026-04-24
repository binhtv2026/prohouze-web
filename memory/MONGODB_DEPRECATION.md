# MongoDB Deprecation Plan

## Current Status: READ-ONLY MODE
**Date:** 2026-03-19
**MONGO_READ_ONLY:** true

## Overview
MongoDB is being deprecated in favor of PostgreSQL (API v2). This document tracks the migration progress.

## API v2 (PostgreSQL) - ACTIVE ✅
All new features should use these endpoints:

| Entity | Endpoint | Status |
|--------|----------|--------|
| Customers | /api/v2/customers | ✅ Active |
| Leads | /api/v2/leads | ✅ Active |
| Deals | /api/v2/deals | ✅ Active |
| Bookings | /api/v2/bookings | ✅ Active |
| Contracts | /api/v2/contracts | ✅ Active |
| Payments | /api/v2/payments | ✅ Active |
| Commissions | /api/v2/commissions | ✅ Active |
| Products | /api/v2/products | ✅ Active |
| Projects | /api/v2/projects | ✅ Active |

## Legacy MongoDB Endpoints - DEPRECATED ⚠️
These endpoints still use MongoDB but are scheduled for removal:

### Critical (Still needed for auth)
- POST /api/auth/login - User authentication
- POST /api/auth/register - User registration
- GET /api/users/* - User management

### Medium Priority (Move to PostgreSQL)
- /api/leads/* - Lead management (use /api/v2/leads instead)
- /api/deals/* - Deal management (use /api/v2/deals instead)
- /api/sales/* - Sales operations

### Low Priority (Can be disabled)
- /api/contents/* - Content management
- /api/response-templates/* - Templates
- /api/channel-configs/* - Channel configurations

## Migration Steps

### Phase 1: Read-Only Mode ✅ (Current)
- Set MONGO_READ_ONLY=true
- All read operations continue working
- Write operations logged with warnings
- New features use PostgreSQL only

### Phase 2: Auth Migration (Next)
- Migrate users table to PostgreSQL
- Update auth endpoints to use PostgreSQL
- Keep MongoDB as fallback

### Phase 3: Full Deprecation (Future)
- Remove all MongoDB write operations
- Convert remaining read operations
- Remove MongoDB connection

## Code Changes Required

### Files with MongoDB writes (server.py):
```
Line 658: db.activities.insert_one
Line 661: db.leads.update_one
Line 680: db.notifications.insert_one
Line 1155: db.leads.update_one
Line 1191: db.tasks.insert_one
Line 1204: db.distribution_rules.update_one
Line 1238: db.users.insert_one
Line 1302: db.channel_configs.insert_one
...
```

## Monitoring
- Check backend logs for: "⚠️ MongoDB write blocked"
- These indicate operations that need migration

## Rollback
If issues occur, set `MONGO_READ_ONLY=false` in .env and restart backend.
