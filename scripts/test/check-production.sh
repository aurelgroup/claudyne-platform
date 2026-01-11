#!/bin/bash

###############################################################################
# Claudyne Production Health Check
# Usage: ./check-production.sh
#
# Vérifie l'état de production après déploiement
# Peut être exécuté manuellement ou appelé par deploy.sh
###############################################################################

set +e  # Continue on errors (we want to see all checks)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER="root@89.117.58.53"
BACKEND_PATH="/opt/claudyne/backend"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Functions
log_check() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ CHECK $1/$TOTAL_CHECKS: $2${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

log_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Header
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}║       CLAUDYNE PRODUCTION HEALTH CHECK               ║${NC}"
echo -e "${BLUE}║       $(date '+%Y-%m-%d %H:%M:%S')                        ║${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}\n"

# Define total checks
TOTAL_CHECKS=10

# ============================================================================
# CHECK 1: Health API Endpoint
# ============================================================================
CURRENT_CHECK=1
log_check $CURRENT_CHECK "Health API Endpoint"

HEALTH_RESPONSE=$(curl -sS --max-time 10 https://claudyne.com/api/health 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    log_pass "API is healthy"
    echo "$HEALTH_RESPONSE" | head -c 200
else
    log_fail "API health check failed"
    echo "$HEALTH_RESPONSE"
fi

# ============================================================================
# CHECK 2: Public Content Endpoint
# ============================================================================
CURRENT_CHECK=2
log_check $CURRENT_CHECK "Public Content Endpoint"

CONTENT_RESPONSE=$(curl -sS --max-time 10 https://claudyne.com/api/public/content 2>&1)
if echo "$CONTENT_RESPONSE" | grep -q '"success":true'; then
    log_pass "Public content accessible"
    echo "$CONTENT_RESPONSE" | head -c 300
    echo "..."
else
    log_fail "Public content check failed"
    echo "$CONTENT_RESPONSE"
fi

# ============================================================================
# CHECK 3: PM2 Process Status
# ============================================================================
CURRENT_CHECK=3
log_check $CURRENT_CHECK "PM2 Process Status"

PM2_STATUS=$(ssh $SERVER "pm2 status" 2>&1)
if echo "$PM2_STATUS" | grep -qE "claudyne-backend.*online"; then
    log_pass "Backend processes online"
    ssh $SERVER "pm2 status | grep -E 'claudyne-backend|claudyne-cron|id.*name.*status'"
else
    log_fail "Backend processes not online"
    echo "$PM2_STATUS"
fi

# ============================================================================
# CHECK 4: Backend Logs (Recent Errors)
# ============================================================================
CURRENT_CHECK=4
log_check $CURRENT_CHECK "Backend Logs - Recent Errors"

BACKEND_ERRORS=$(ssh $SERVER "pm2 logs claudyne-backend --lines 100 --nostream 2>&1 | grep -iE 'error|fatal|exception' | tail -10")
if [ -z "$BACKEND_ERRORS" ]; then
    log_pass "No recent errors in backend logs"
else
    log_warn "Found errors in backend logs:"
    echo "$BACKEND_ERRORS"
fi

# ============================================================================
# CHECK 5: Cron Logs (Database Errors)
# ============================================================================
CURRENT_CHECK=5
log_check $CURRENT_CHECK "Cron Logs - Database Connection"

CRON_DB_ERRORS=$(ssh $SERVER "pm2 logs claudyne-cron --lines 200 --nostream 2>&1 | grep -iE 'password must be a string|SequelizeConnectionError|SCRAM' | tail -10")
if [ -z "$CRON_DB_ERRORS" ]; then
    log_pass "No database connection errors in cron"
else
    log_fail "Database errors found in cron logs:"
    echo "$CRON_DB_ERRORS"
fi

# ============================================================================
# CHECK 6: Cron Jobs Active
# ============================================================================
CURRENT_CHECK=6
log_check $CURRENT_CHECK "Cron Jobs Status"

CRON_ACTIVE=$(ssh $SERVER "pm2 logs claudyne-cron --lines 50 --nostream 2>&1 | grep -E '✅.*cron jobs actifs|🎯.*Cron jobs démarrés' | tail -3")
if [ -n "$CRON_ACTIVE" ]; then
    log_pass "Cron jobs are active"
    echo "$CRON_ACTIVE"
else
    log_warn "Could not confirm cron jobs status"
fi

# ============================================================================
# CHECK 7: Database Configuration
# ============================================================================
CURRENT_CHECK=7
log_check $CURRENT_CHECK "Database Configuration"

DB_CONFIG=$(ssh $SERVER "cd $BACKEND_PATH && grep -E '^DB_HOST|^DB_PORT|^DB_NAME|^DB_USER' .env.production 2>/dev/null")
if [ -n "$DB_CONFIG" ]; then
    log_pass "Database configuration found"
    echo "$DB_CONFIG"

    # Check DB_PASSWORD exists (but don't show it)
    if ssh $SERVER "cd $BACKEND_PATH && grep -q '^DB_PASSWORD=' .env.production 2>/dev/null"; then
        log_pass "DB_PASSWORD is set"
    else
        log_fail "DB_PASSWORD not found in .env.production"
    fi
else
    log_fail "Database configuration not found"
fi

# ============================================================================
# CHECK 8: Environment File Status
# ============================================================================
CURRENT_CHECK=8
log_check $CURRENT_CHECK "Environment Files"

ENV_FILES=$(ssh $SERVER "cd $BACKEND_PATH && ls -lh .env* 2>/dev/null | grep -v node_modules")
if echo "$ENV_FILES" | grep -q ".env.production"; then
    log_pass ".env.production exists"
    echo "$ENV_FILES"

    # Check for redundant .env
    if echo "$ENV_FILES" | grep -qE "^-.*\.env$"; then
        log_warn "Redundant .env file exists alongside .env.production"
    else
        log_pass "No redundant .env file"
    fi
else
    log_fail ".env.production not found"
fi

# ============================================================================
# CHECK 9: PM2 Restart Count
# ============================================================================
CURRENT_CHECK=9
log_check $CURRENT_CHECK "PM2 Restart History"

RESTART_INFO=$(ssh $SERVER "pm2 describe claudyne-backend 2>/dev/null | grep -E 'restarts|unstable restarts'" | head -2)
if [ -n "$RESTART_INFO" ]; then
    echo "$RESTART_INFO"

    UNSTABLE=$(echo "$RESTART_INFO" | grep "unstable restarts" | grep -oE '[0-9]+')
    if [ "$UNSTABLE" == "0" ] 2>/dev/null; then
        log_pass "No unstable restarts (crashes)"
    else
        log_warn "Unstable restarts detected: $UNSTABLE"
    fi
else
    log_warn "Could not retrieve restart info"
fi

# ============================================================================
# CHECK 10: API Contract Tests
# ============================================================================
CURRENT_CHECK=10
log_check $CURRENT_CHECK "API Contract Tests"

if [ -f "test-api-contracts.sh" ]; then
    if bash test-api-contracts.sh > /tmp/contract-test-output.txt 2>&1; then
        log_pass "All API contracts validated"
        grep "✅" /tmp/contract-test-output.txt | tail -5
    else
        log_fail "API contract tests failed"
        tail -20 /tmp/contract-test-output.txt
    fi
else
    log_warn "test-api-contracts.sh not found, skipping contract tests"
    ((TOTAL_CHECKS--))  # Adjust total if test not available
fi

# ============================================================================
# FINAL REPORT
# ============================================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}           FINAL REPORT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Total Checks:   ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed:         ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed:         ${RED}$FAILED_CHECKS${NC}"
echo -e "Success Rate:   $(awk "BEGIN {printf \"%.1f%%\", ($PASSED_CHECKS/$TOTAL_CHECKS)*100}")\n"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║         ✅  PRODUCTION IS HEALTHY  ✅                ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}\n"
    exit 0
elif [ $FAILED_CHECKS -le 2 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║      ⚠️   PRODUCTION HAS MINOR ISSUES  ⚠️           ║${NC}"
    echo -e "${YELLOW}║           Review warnings above                       ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}\n"
    exit 1
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║       ❌  PRODUCTION HAS CRITICAL ISSUES  ❌         ║${NC}"
    echo -e "${RED}║          Immediate action required                    ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}\n"
    exit 2
fi
