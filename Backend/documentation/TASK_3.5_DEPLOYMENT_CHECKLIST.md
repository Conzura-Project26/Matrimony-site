# Task 3.5: Profile Views & Activity - Deployment Checklist
## Pre-Launch Verification & Deployment Guide

---

## ✅ Pre-Deployment Checklist

### 1. Code Quality & Compilation
- [x] All TypeScript/JavaScript files compile without errors
- [x] No ESLint warnings or errors
- [x] All imports resolve correctly
- [x] Prisma schema valid and up-to-date
- [x] No merge conflicts in codebase

**Verification Command:**
```bash
cd Backend
npm run lint          # Check for linting issues
npx prisma validate   # Validate schema
```

---

### 2. Database Migration
- [x] Migration file created: `20260202120000_add_profile_views_system`
- [x] Migration SQL syntax validated
- [x] All indexes defined
- [x] Constraints properly set
- [x] Foreign keys configured with CASCADE/SET NULL

**Verification Commands:**
```bash
# Check migration status
npx prisma migrate status

# Apply migration (if not already applied)
npx prisma migrate deploy

# Verify tables exist
psql $DATABASE_URL -c "\d profile_views"
psql $DATABASE_URL -c "\d+ profile_views"  # Show indexes
```

**Expected Output:**
```
Tables:
✓ profile_views (9 columns)
✓ ViewSource enum (6 values)
✓ users.profile_views_count column added

Indexes:
✓ profile_views_pkey
✓ profile_views_viewed_user_id_viewed_at_idx
✓ profile_views_viewer_id_viewed_at_idx
✓ profile_views_viewer_id_viewed_user_id_viewed_at_idx
✓ profile_views_view_source_viewed_at_idx
✓ profile_views_search_log_id_idx
```

---

### 3. Environment Configuration
- [ ] DATABASE_URL configured correctly
- [ ] JWT_SECRET set
- [ ] NODE_ENV set (development/staging/production)
- [ ] LOG_LEVEL configured
- [ ] CORS origins whitelisted

**Check `.env` file:**
```bash
# Required variables
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
LOG_LEVEL=info
```

---

### 4. API Routes Registration
- [x] viewRoutes imported in index.js
- [x] Routes registered with authentication
- [x] Middleware applied correctly
- [x] Swagger documentation accessible

**Verification:**
```bash
# Start server
npm start

# Check routes registered
curl http://localhost:3000/api-docs

# Verify endpoints exist
curl -I http://localhost:3000/profile/viewers  # Should return 401
```

---

### 5. Testing Suite
- [x] All unit tests written (viewService.test.js)
- [x] All integration tests written (viewAPI.test.js)
- [x] Test database configured
- [x] Test data seeded

**Run Tests:**
```bash
# Run all tests
npm test

# Run specific test suites
npm test src/tests/views/viewService.test.js
npm test src/tests/views/viewAPI.test.js

# Run with coverage
npm test -- --coverage
```

**Expected Results:**
- ✅ All 25+ test cases pass
- ✅ Coverage > 90%
- ✅ No warnings or errors

---

### 6. Manual Testing (Postman/cURL)
- [ ] POST /profiles/:id/view returns 204
- [ ] GET /profile/viewers returns 200 with data
- [ ] GET /profile/viewed returns 200 with data
- [ ] GET /profile/viewers/count returns accurate counts
- [ ] GET /profile/viewed/count returns accurate counts
- [ ] Rate limiting enforced (3 views/hour)
- [ ] Self-view returns 400 error
- [ ] Invalid profile ID returns 404
- [ ] Unauthenticated request returns 401

**Test Scripts:**
```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile_number":"+919876543210","password":"Test@1234"}' \
  | jq -r '.data.token')

# 2. Record a view
curl -X POST http://localhost:3000/profiles/{profile-id}/view \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"view_source":"SEARCH","view_duration":45}'

# 3. Get viewers
curl http://localhost:3000/profile/viewers \
  -H "Authorization: Bearer $TOKEN"

# 4. Get viewed profiles
curl http://localhost:3000/profile/viewed \
  -H "Authorization: Bearer $TOKEN"

# 5. Get counts
curl http://localhost:3000/profile/viewers/count \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. Performance Testing
- [ ] View recording: < 100ms (p95)
- [ ] Get viewers: < 200ms (p95)
- [ ] Get viewed: < 200ms (p95)
- [ ] Count queries: < 50ms (p95)
- [ ] Database indexes utilized
- [ ] No N+1 queries

**Performance Check:**
```bash
# Run verification script
node scripts/verify-profile-views.js

# Load test (optional)
# npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3000/profile/viewers
```

---

### 8. Documentation
- [x] Swagger/OpenAPI docs complete
- [x] README updated with new endpoints
- [x] Quick reference guide created
- [x] Visual architecture diagram created
- [x] Code comments and JSDoc
- [x] Deployment instructions

**Documentation Files:**
- ✅ TASK_3.5_COMPLETE_REFERENCE.md
- ✅ TASK_3.5_QUICK_REFERENCE.md
- ✅ TASK_3.5_VISUAL_ARCHITECTURE.md
- ✅ TASK_3.5_SUMMARY.md
- ✅ Swagger UI at /api-docs

---

### 9. Security Review
- [x] Authentication required on all endpoints
- [x] Authorization (permissions) checked
- [x] Self-view prevention at DB level
- [x] Rate limiting implemented
- [x] Input validation on all fields
- [x] SQL injection prevention (Prisma ORM)
- [x] No sensitive data in logs

**Security Checklist:**
- ✅ JWT validation on all routes
- ✅ `view_profiles` permission required
- ✅ Database constraints prevent self-views
- ✅ Rate limiting: 3 views/hour
- ✅ User-agent/IP tracking optional (configurable)
- ✅ No password/token logging

---

### 10. Error Handling
- [x] All errors caught and logged
- [x] Meaningful error messages
- [x] Proper HTTP status codes
- [x] Error middleware configured
- [x] No stack traces in production

**Error Scenarios Tested:**
- ✅ Invalid user ID → 404
- ✅ Self-view attempt → 400
- ✅ Rate limit exceeded → 204 (silent)
- ✅ Unauthenticated → 401
- ✅ Missing permission → 403
- ✅ Database error → 500

---

## 🚀 Deployment Steps

### Step 1: Backup Database
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Step 2: Apply Migration
```bash
cd Backend
npx prisma migrate deploy
npx prisma generate
```

**Expected Output:**
```
✔ Applying migration `20260202120000_add_profile_views_system`
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### Step 3: Verify Schema
```bash
node scripts/verify-profile-views.js
```

**Expected Output:**
```
✅ profile_views table exists
✅ Found 6 indexes
✅ Found 6 enum values
✅ All verification checks passed!
```

### Step 4: Seed Test Data (Optional)
```bash
# For staging/development only
node scripts/seed-profile-views.js
```

### Step 5: Run Tests
```bash
npm test src/tests/views/
```

**Expected Output:**
```
 PASS  src/tests/views/viewService.test.js
 PASS  src/tests/views/viewAPI.test.js

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
```

### Step 6: Start Application
```bash
# Production
NODE_ENV=production npm start

# With PM2 (recommended)
pm2 start index.js --name "sarvvivah-backend"
pm2 save
```

### Step 7: Smoke Tests
```bash
# Health check
curl http://your-domain.com/

# API docs
curl http://your-domain.com/api-docs

# Test endpoint (with valid token)
curl -H "Authorization: Bearer $TOKEN" \
  http://your-domain.com/profile/viewers
```

### Step 8: Monitor Logs
```bash
# Check application logs
tail -f Backend/logs/app-$(date +%Y-%m-%d).log

# With PM2
pm2 logs sarvvivah-backend

# Check for errors
grep ERROR Backend/logs/app-$(date +%Y-%m-%d).log
```

---

## 📊 Post-Deployment Monitoring

### Metrics to Watch (First 24 Hours)

#### 1. API Performance
- [ ] Profile view recording: < 100ms avg
- [ ] Get viewers endpoint: < 200ms avg
- [ ] Error rate: < 0.1%
- [ ] Rate limit triggers: Monitor count

**Check with:**
```bash
# CloudWatch (AWS) or similar
# Application Insights (Azure)
# Or custom logging analysis
```

#### 2. Database Performance
- [ ] Query response time: < 50ms (p95)
- [ ] Index usage: Verify with EXPLAIN
- [ ] Connection pool: Monitor utilization
- [ ] Slow query log: Check for > 100ms queries

**Check with:**
```sql
-- Check slow queries
SELECT 
  query, 
  mean_exec_time, 
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'profile_views';
```

#### 3. Feature Adoption
- [ ] Total views recorded (first day)
- [ ] Unique users viewing profiles
- [ ] Average views per user
- [ ] "Who viewed me" API usage

**Analytics Queries:**
```sql
-- Total views in last 24 hours
SELECT COUNT(*) FROM profile_views
WHERE viewed_at > NOW() - INTERVAL '24 hours';

-- Unique viewers
SELECT COUNT(DISTINCT viewer_id) FROM profile_views
WHERE viewed_at > NOW() - INTERVAL '24 hours';

-- Most viewed profiles
SELECT 
  u.profile_id,
  COUNT(*) as views
FROM profile_views pv
JOIN users u ON u.id = pv.viewed_user_id
WHERE pv.viewed_at > NOW() - INTERVAL '24 hours'
GROUP BY u.id
ORDER BY views DESC
LIMIT 10;
```

#### 4. Error Monitoring
- [ ] Check error logs for exceptions
- [ ] Monitor rate limit warnings
- [ ] Check for failed DB connections
- [ ] Verify no 500 errors

**Monitor:**
```bash
# Errors in logs
grep -i error Backend/logs/app-$(date +%Y-%m-%d).log

# Rate limit warnings
grep "rate limit exceeded" Backend/logs/app-$(date +%Y-%m-%d).log

# Failed DB queries
grep "prisma" Backend/logs/app-$(date +%Y-%m-%d).log | grep -i error
```

---

## 🔄 Rollback Plan

### If Issues Arise:

#### Option 1: Rollback Migration
```bash
# Revert migration
npx prisma migrate resolve --rolled-back 20260202120000_add_profile_views_system

# Drop table manually
psql $DATABASE_URL -c "DROP TABLE IF EXISTS profile_views CASCADE;"
psql $DATABASE_URL -c "DROP TYPE IF EXISTS ViewSource;"
psql $DATABASE_URL -c "ALTER TABLE users DROP COLUMN IF EXISTS profile_views_count;"
```

#### Option 2: Disable Routes
```javascript
// In index.js, comment out:
// app.use('/', viewRoutes);

// Restart application
pm2 restart sarvvivah-backend
```

#### Option 3: Feature Flag
```javascript
// In viewController.js, add check:
if (process.env.DISABLE_PROFILE_VIEWS === 'true') {
  return res.status(503).json({
    message: 'Feature temporarily disabled'
  });
}
```

---

## 📞 Support & Troubleshooting

### Common Issues

#### Issue 1: Migration Fails
**Symptom:** Prisma migrate deploy fails  
**Solution:**
```bash
# Check current state
npx prisma migrate status

# Reset if needed (development only!)
npx prisma migrate reset

# Apply manually
psql $DATABASE_URL < prisma/migrations/20260202120000_add_profile_views_system/migration.sql
```

#### Issue 2: Views Not Recording
**Symptom:** POST /profiles/:id/view returns 204 but no data  
**Check:**
- Rate limit exceeded? (max 3/hour)
- Self-view attempt? (viewer == viewed)
- User blocked?
- Profile inactive?

**Debug:**
```bash
# Check logs
grep "Profile view" Backend/logs/app-$(date +%Y-%m-%d).log

# Check rate limit
psql $DATABASE_URL -c "
  SELECT viewer_id, viewed_user_id, COUNT(*)
  FROM profile_views
  WHERE viewed_at > NOW() - INTERVAL '1 hour'
  GROUP BY viewer_id, viewed_user_id
  HAVING COUNT(*) >= 3;
"
```

#### Issue 3: Slow Queries
**Symptom:** GET /profile/viewers takes > 1 second  
**Solution:**
```bash
# Verify indexes exist
psql $DATABASE_URL -c "\d profile_views"

# Analyze query plan
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT DISTINCT ON (viewer_id)
    viewer_id, viewed_at
  FROM profile_views
  WHERE viewed_user_id = 'uuid-here'
  ORDER BY viewer_id, viewed_at DESC;
"

# Rebuild indexes if needed
psql $DATABASE_URL -c "REINDEX TABLE profile_views;"
```

#### Issue 4: Count Mismatch
**Symptom:** profile_views_count doesn't match actual count  
**Solution:**
```bash
# Recalculate cache
psql $DATABASE_URL -c "
  UPDATE users
  SET profile_views_count = (
    SELECT COUNT(*)
    FROM profile_views
    WHERE viewed_user_id = users.id
  );
"
```

---

## ✅ Final Sign-Off

### Code Review Checklist
- [ ] Code reviewed by senior developer
- [ ] Security review completed
- [ ] Performance review completed
- [ ] Documentation reviewed
- [ ] Tests reviewed and passing

### Deployment Approval
- [ ] Product manager approval
- [ ] Tech lead approval
- [ ] QA sign-off
- [ ] Stakeholder notification sent

### Communication
- [ ] Team notified of deployment
- [ ] Release notes published
- [ ] Support team briefed
- [ ] Monitoring alerts configured

---

## 📝 Deployment Record

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Migration Version:** 20260202120000_add_profile_views_system  
**Git Commit:** _______________  
**Database Backup:** _______________  
**Rollback Plan Tested:** [ ] Yes [ ] No  
**Post-Deployment Checks:** [ ] Complete

**Issues Encountered:**
_______________________________________________________
_______________________________________________________

**Resolution:**
_______________________________________________________
_______________________________________________________

**Sign-Off:** _______________ (Name & Date)

---

**Document Version:** 1.0  
**Last Updated:** February 2, 2025  
**Status:** Ready for Deployment
