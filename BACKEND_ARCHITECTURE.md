# Claudyne Backend Architecture

## Current Entry Points

### ⚠️ ATTENTION: Architecture Not Yet Unified

There are **multiple backend entry points** currently:

| Command | File | Type | Status | Used? |
|---------|------|------|--------|-------|
| `npm start` | `server.js` (racine) | Express | Production | ❓ Unclear |
| `npm run backend:prod` | `backend/minimal-server.js` | HTTP Native | Production | ✅ Likely |
| `npm run production` | `backend/minimal-server.js` | HTTP Native | Production | ✅ Likely |
| `npm run mobile-api` | `backend/mobile-server.js` | HTTP Native | Development | ❓ |
| `backend/src/server.js` | Express | Development | ❓ | ❓ |

### Key Observations

1. **server.js (Express, racine)**:
   - Imports: `backend/production-endpoints.js`
   - Uses: `backend/config/production`
   - Modern stack: Express, middleware-based

2. **backend/minimal-server.js (HTTP Native)**:
   - ~3000 lines of raw HTTP handling
   - Handles: API routes, WebSockets(?), deployments
   - More control, less abstraction

3. **backend/mobile-server.js**:
   - ~363 lines
   - Appears to be copy of minimal-server with mobile tweaks
   - Duplicated code

4. **backend/src/server.js**:
   - Express setup
   - Sequelize ORM models
   - Proper middleware structure

---

## Recommendation: Consolidation Roadmap

### Phase 1: Documentation (Done ✅)
- [x] Identify which server is actually used in production
- [ ] Ask DevOps/deployment team which is REALLY running

### Phase 2: Validation (TODO)
- [ ] Check production logs to verify entry point
- [ ] Test both servers start without errors
- [ ] Ensure feature parity

### Phase 3: Consolidation (TODO - Not urgent)
Option A: **Standardize on Express (`server.js`)**
  - More maintainable
  - Better middleware support
  - Cleaner codebase
  - Risk: Needs careful testing

Option B: **Standardize on HTTP Native (`minimal-server.js`)**
  - Works now
  - Lower dependency count
  - Risk: 3000 lines of hand-rolled code

### Decision Required
**Before consolidating, clarify with team:**
1. What's currently deployed in production?
2. Why were both created?
3. Any specific reason for raw HTTP vs Express?

---

## Questions to Answer

- [ ] Is `npm run production:deploy` what's actually executed on prod servers?
- [ ] Is `mobile-server.js` actively used by mobile app?
- [ ] Can we deprecate one of the entry points?
- [ ] Are there configuration differences between them?

---

## For Now

**Use `npm run backend:prod` in deployment scripts** until consolidation plan is approved.

All other entry points should have a comment pointing to this document.
