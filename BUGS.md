# SwapSafe Marketplace - Bug Tracker

> Last Updated: 2026-02-02
> Use this file to track all bugs and issues

---

## Bug Severity Levels
- 🔴 **Critical**: Blocks core functionality, must fix immediately
- 🟠 **High**: Significant impact, fix soon
- 🟡 **Medium**: Noticeable issue, plan to fix
- 🟢 **Low**: Minor issue, fix when convenient

---

## Open Bugs

### 🔴 Critical

| ID | Description | Component | Status |
|----|-------------|-----------|--------|
| BUG-001 | Nothing happens after signing in (production) | Auth/Login | ✅ Fixed |
| BUG-002 | AI Engine URL changes on tunnel restart | DevOps | ⏳ Workaround in place |

### 🟠 High

| ID | Description | Component | Status |
|----|-------------|-----------|--------|
| BUG-003 | Tunnel URL not permanent (needs domain) | DevOps | 📝 Documented |

### 🟡 Medium

| ID | Description | Component | Status |
|----|-------------|-----------|--------|
| (To be discovered) | | | |

### 🟢 Low

| ID | Description | Component | Status |
|----|-------------|-----------|--------|
| (To be discovered) | | | |

---

## Fixed Bugs

| ID | Description | Fixed Date | Fix Summary |
|----|-------------|-----------|-------------|
| BUG-F001 | Camera not initializing | 2026-02-01 | Used onloadedmetadata for video play |
| BUG-F002 | Auto-enhance before product details | 2026-02-01 | Moved enhance to after form fill |

---

## Bug Discovery Checklist

### Frontend Pages to Test
- [ ] Home page
- [ ] Login page
- [ ] Register page
- [ ] Quick Sell flow
- [ ] Product listing page
- [ ] Search functionality
- [ ] User profile
- [ ] Settings

### Backend APIs to Test
- [ ] /api/auth/login
- [ ] /api/auth/register
- [ ] /api/listings
- [ ] /api/ai/enhance-photo
- [ ] /api/ai/estimate-price

### AI Engine to Test
- [ ] /health
- [ ] /api/v1/studio/enhance
- [ ] /api/v1/studio/generate-3d

---

## How to Report a Bug

1. Add to appropriate severity section above
2. Assign next available ID (BUG-XXX)
3. Include: Description, Component, Steps to reproduce
4. Update status as you work on it

---

## Status Legend
- 🆕 New
- 🔍 Investigating
- 🔧 In Progress
- ✅ Fixed
- 🚫 Won't Fix
- ⏳ Workaround in place
- 📝 Documented
