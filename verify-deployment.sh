#!/bin/bash

###############################################################################
# Claudyne Deployment Verification Script
# Usage: ./verify-deployment.sh
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER="root@89.117.58.53"
FRONTEND_PATH="/opt/claudyne"

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

ERRORS=0

echo ""
log_info "=========================================="
log_info "  Claudyne Deployment Verification"
log_info "=========================================="
echo ""

# 1. Check NGINX root directory
log_info "1. Checking NGINX root directory..."
NGINX_ROOT=$(ssh $SERVER "cat /etc/nginx/sites-enabled/claudyne | grep -m 1 'root ' | awk '{print \$2}' | tr -d ';'")

if [ "$NGINX_ROOT" == "/opt/claudyne" ]; then
    log_success "NGINX root is correct: $NGINX_ROOT"
else
    log_error "NGINX root is WRONG: $NGINX_ROOT (should be /opt/claudyne)"
    ERRORS=$((ERRORS + 1))
fi

# 2. Check frontend files exist
log_info "2. Checking frontend files..."
REQUIRED_FILES=(
    "student-interface-modern.html"
    "sw.js"
    "index.html"
)

for file in "${REQUIRED_FILES[@]}"; do
    if ssh $SERVER "[ -f $FRONTEND_PATH/$file ]"; then
        TIMESTAMP=$(ssh $SERVER "stat -c %y $FRONTEND_PATH/$file" 2>/dev/null || ssh $SERVER "stat -f '%Sm' $FRONTEND_PATH/$file" 2>/dev/null)
        log_success "$file exists (modified: $TIMESTAMP)"
    else
        log_error "$file NOT FOUND at $FRONTEND_PATH/"
        ERRORS=$((ERRORS + 1))
    fi
done

# 3. Check service worker version consistency
log_info "3. Checking service worker version..."
if [ -f "sw.js" ]; then
    LOCAL_VERSION=$(grep "CACHE_NAME =" sw.js | head -1 | cut -d"'" -f2)
    REMOTE_VERSION=$(ssh $SERVER "grep 'CACHE_NAME =' $FRONTEND_PATH/sw.js | head -1" | cut -d"'" -f2)
    SERVED_VERSION=$(curl -s https://www.claudyne.com/sw.js | grep "CACHE_NAME =" | head -1 | cut -d"'" -f2)

    log_info "  Local:  $LOCAL_VERSION"
    log_info "  Remote: $REMOTE_VERSION"
    log_info "  Served: $SERVED_VERSION"

    if [ "$LOCAL_VERSION" == "$REMOTE_VERSION" ] && [ "$REMOTE_VERSION" == "$SERVED_VERSION" ]; then
        log_success "Service worker versions match: $LOCAL_VERSION"
    else
        log_error "Service worker version mismatch!"
        ERRORS=$((ERRORS + 1))
    fi
else
    log_warning "sw.js not found locally, skipping version check"
fi

# 4. Check button code in production
log_info "4. Checking student interface button..."
BUTTON_CODE=$(curl -s https://www.claudyne.com/student-interface-modern.html | grep -A 2 "Découvrir les matières" | grep "onclick" || echo "NOT FOUND")

if echo "$BUTTON_CODE" | grep -q "showSection('subjects')"; then
    log_success "Button code is CORRECT: showSection('subjects')"
else
    log_error "Button code is WRONG or not found!"
    log_error "Found: $BUTTON_CODE"
    ERRORS=$((ERRORS + 1))
fi

# 5. Check for lessons.html references
log_info "5. Checking for lessons.html references..."
LESSONS_REF=$(ssh $SERVER "grep -r 'lessons\.html' $FRONTEND_PATH/*.html 2>/dev/null | wc -l")

if [ "$LESSONS_REF" -eq "0" ]; then
    log_success "No references to lessons.html found (correct)"
else
    log_error "Found $LESSONS_REF references to lessons.html!"
    ssh $SERVER "grep -n 'lessons\.html' $FRONTEND_PATH/*.html"
    ERRORS=$((ERRORS + 1))
fi

# 6. Check backend health
log_info "6. Checking backend health..."
HEALTH_STATUS=$(curl -s https://www.claudyne.com/api/health | jq -r .status 2>/dev/null || echo "error")

if [ "$HEALTH_STATUS" == "healthy" ]; then
    log_success "Backend is healthy"
else
    log_error "Backend health check failed: $HEALTH_STATUS"
    ERRORS=$((ERRORS + 1))
fi

# 7. Check PM2 status
log_info "7. Checking PM2 status..."
PM2_STATUS=$(ssh $SERVER "pm2 jlist | jq -r '.[] | select(.name==\"claudyne-backend\") | .pm2_env.status'")

if [ "$PM2_STATUS" == "online" ]; then
    log_success "PM2 backend is online"
else
    log_error "PM2 backend status: $PM2_STATUS"
    ERRORS=$((ERRORS + 1))
fi

# 8. Check file MD5 hashes
log_info "8. Comparing file hashes..."
if [ -f "student-interface-modern.html" ]; then
    if command -v md5sum &> /dev/null; then
        LOCAL_MD5=$(md5sum student-interface-modern.html | awk '{print $1}')
    else
        LOCAL_MD5=$(md5 -q student-interface-modern.html 2>/dev/null || echo "unknown")
    fi

    REMOTE_MD5=$(ssh $SERVER "md5sum $FRONTEND_PATH/student-interface-modern.html | awk '{print \$1}'")

    if [ "$LOCAL_MD5" == "$REMOTE_MD5" ]; then
        log_success "student-interface-modern.html matches (MD5: $LOCAL_MD5)"
    else
        log_error "student-interface-modern.html DOES NOT MATCH!"
        log_error "Local:  $LOCAL_MD5"
        log_error "Remote: $REMOTE_MD5"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Summary
echo ""
log_info "=========================================="
if [ $ERRORS -eq 0 ]; then
    log_success "  All checks passed! ✅"
    log_success "  Deployment is correct."
else
    log_error "  Found $ERRORS error(s)! ❌"
    log_error "  Please fix the issues above."
fi
log_info "=========================================="
echo ""

exit $ERRORS
