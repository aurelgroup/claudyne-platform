#!/bin/bash

###############################################################################
# Claudyne Deployment Script
# Usage: ./deploy.sh [frontend|backend|nextjs|all] [--bump-sw]
#
# Options:
#   frontend  : Deploy static HTML files (index.html, admin-interface, etc.)
#   backend   : Deploy backend routes, models, middleware, utils
#   nextjs    : Deploy Next.js application (frontend/ directory)
#   all       : Deploy everything (frontend + backend + nextjs)
#   --bump-sw : Automatically bump service worker version before deploy
#
# Examples:
#   ./deploy.sh nextjs                 # Deploy only Next.js
#   ./deploy.sh backend                # Deploy only backend
#   ./deploy.sh all --bump-sw          # Full deployment with SW bump
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SERVER="root@89.117.58.53"
FRONTEND_PATH="/opt/claudyne"
BACKEND_PATH="/opt/claudyne/backend/src"

# Parse options
BUMP_SW=false
for arg in "$@"; do
    if [ "$arg" == "--bump-sw" ]; then
        BUMP_SW=true
    fi
done

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_highlight() {
    echo -e "${PURPLE}🔔 $1${NC}"
}

# Check if file exists locally
check_file() {
    if [ ! -f "$1" ]; then
        log_error "File not found: $1"
        exit 1
    fi
}

# Bump service worker version
bump_service_worker() {
    if [ ! -f "sw.js" ]; then
        log_error "sw.js not found!"
        return 1
    fi

    log_info "Bumping service worker version..."

    # Extract current version
    CURRENT_VERSION=$(grep "CACHE_NAME =" sw.js | head -1 | sed "s/.*'claudyne-v\([0-9.]*\)'.*/\1/")

    if [ -z "$CURRENT_VERSION" ]; then
        log_error "Could not extract current version from sw.js"
        return 1
    fi

    # Parse major.minor.patch
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

    # Increment patch version
    PATCH=$((PATCH + 1))
    NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

    # Update sw.js
    sed -i.bak "s/CACHE_NAME = 'claudyne-v${CURRENT_VERSION}'/CACHE_NAME = 'claudyne-v${NEW_VERSION}'/" sw.js

    log_success "Version bumped: v${CURRENT_VERSION} → v${NEW_VERSION}"
    log_highlight "Remember to commit sw.js after deployment!"
}

# Deploy frontend files
deploy_frontend() {
    log_info "Deploying frontend files..."

    # Bump service worker version if requested
    if [ "$BUMP_SW" = true ]; then
        bump_service_worker
    fi

    # Critical files that MUST exist
    CRITICAL_FILES=(
        "index.html"
        "student-interface-modern.html"
        "admin-interface.html"
        "sw.js"
    )

    # Optional files (won't fail deployment if missing)
    OPTIONAL_FILES=(
        "parent-interface.html"
        "lessons.html"
        "clear-cache.html"
    )

    # Deploy critical files
    log_info "Deploying critical files..."
    for file in "${CRITICAL_FILES[@]}"; do
        check_file "$file"
        log_info "Deploying $file..."
        scp "$file" "$SERVER:$FRONTEND_PATH/"
        log_success "$file deployed"
    done

    # Deploy optional files
    log_info "Deploying optional files..."
    for file in "${OPTIONAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            log_info "Deploying $file..."
            scp "$file" "$SERVER:$FRONTEND_PATH/"
            log_success "$file deployed"
        else
            log_warning "$file not found, skipping..."
        fi
    done

    # Verify service worker version
    log_info "Verifying service worker version..."
    LOCAL_SW_VERSION=$(grep "CACHE_NAME =" sw.js | head -1)
    REMOTE_SW_VERSION=$(ssh $SERVER "grep 'CACHE_NAME =' $FRONTEND_PATH/sw.js | head -1")

    if [ "$LOCAL_SW_VERSION" == "$REMOTE_SW_VERSION" ]; then
        log_success "Service worker version matches: $LOCAL_SW_VERSION"
    else
        log_error "Service worker version mismatch!"
        log_error "Local:  $LOCAL_SW_VERSION"
        log_error "Remote: $REMOTE_SW_VERSION"
        exit 1
    fi

    # Verify ALL deployed files
    log_info "Verifying deployed files..."
    ALL_FILES=("${CRITICAL_FILES[@]}" "${OPTIONAL_FILES[@]}")
    for file in "${ALL_FILES[@]}"; do
        if [ -f "$file" ]; then
            TIMESTAMP=$(ssh $SERVER "stat -c %y $FRONTEND_PATH/$file 2>/dev/null || stat -f '%Sm' $FRONTEND_PATH/$file 2>/dev/null" | cut -d'.' -f1)
            log_success "$file verified (modified: $TIMESTAMP)"
        fi
    done
}

# Deploy Next.js frontend
deploy_nextjs() {
    log_info "Deploying Next.js frontend..."

    # Check if frontend directory exists
    if [ ! -d "frontend" ]; then
        log_error "frontend/ directory not found!"
        exit 1
    fi

    log_info "Syncing frontend files to server..."
    # Use rsync to sync frontend, excluding build artifacts and dependencies
    if command -v rsync &> /dev/null; then
        rsync -az --delete \
            --exclude 'node_modules' \
            --exclude '.next' \
            --exclude '.env.local' \
            frontend/ $SERVER:/opt/claudyne/frontend/
        log_success "Frontend files synced"
    else
        log_error "rsync not found! Please install rsync for safer deployment"
        exit 1
    fi

    # Build on server
    log_info "Building Next.js on server..."
    ssh $SERVER "cd /opt/claudyne/frontend && npm run build" || {
        log_error "Next.js build failed!"
        exit 1
    }
    log_success "Next.js build completed"

    # Restart or start PM2 process
    log_info "Managing PM2 process for frontend..."
    FRONTEND_RUNNING=$(ssh $SERVER "pm2 list | grep claudyne-frontend | wc -l")

    if [ "$FRONTEND_RUNNING" -gt "0" ]; then
        log_info "Restarting existing frontend process..."
        ssh $SERVER "pm2 restart claudyne-frontend"
    else
        log_info "Starting new frontend process..."
        ssh $SERVER "cd /opt/claudyne/frontend && pm2 start npm --name claudyne-frontend -- start"
    fi

    ssh $SERVER "pm2 save"
    log_success "PM2 frontend process managed"

    # Verify Next.js is running
    sleep 5
    log_info "Verifying Next.js health..."
    NEXTJS_RESPONSE=$(ssh $SERVER 'curl -s http://localhost:3000 | grep -o "id=\"__next\"" || echo "error"')

    if [ "$NEXTJS_RESPONSE" == "id=\"__next\"" ]; then
        log_success "Next.js is running on port 3000"
    else
        log_error "Next.js health check failed!"
        log_error "Showing PM2 logs:"
        ssh $SERVER "pm2 logs claudyne-frontend --lines 30 --nostream"
        exit 1
    fi
}

# Deploy backend files
deploy_backend() {
    log_info "Deploying backend files..."

    # Backup warning for sensitive files
    log_warning "Deploying backend - ensure no sensitive configs are overwritten"

    # Backend directories to deploy
    BACKEND_DIRS=(
        "backend/src/routes"
        "backend/src/models"
        "backend/src/middleware"
        "backend/src/utils"
    )

    # Deploy each directory if it exists
    for dir in "${BACKEND_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            DIR_NAME=$(basename "$dir")
            log_info "Deploying $DIR_NAME..."

            # Use rsync if available for safer deployment
            if command -v rsync &> /dev/null; then
                rsync -az --delete "$dir/" "$SERVER:$BACKEND_PATH/$DIR_NAME/"
                log_success "$DIR_NAME deployed (with rsync)"
            else
                scp -r "$dir"/* "$SERVER:$BACKEND_PATH/$DIR_NAME/"
                log_success "$DIR_NAME deployed (with scp)"
            fi
        else
            log_warning "$dir not found, skipping..."
        fi
    done

    # Restart PM2
    log_info "Restarting backend..."
    ssh $SERVER "cd /opt/claudyne && pm2 restart claudyne-backend --update-env && pm2 save"

    sleep 5  # Increased wait time for restart

    # Verify backend is running
    log_info "Checking backend health..."
    HEALTH_STATUS=$(ssh $SERVER 'curl -s http://127.0.0.1:3001/api/health | jq -r .status' 2>/dev/null || echo "error")

    if [ "$HEALTH_STATUS" == "healthy" ]; then
        log_success "Backend is healthy"

        # Check PM2 status
        PM2_STATUS=$(ssh $SERVER "pm2 jlist | jq -r '.[] | select(.name==\"claudyne-backend\") | .pm2_env.status'")
        log_info "PM2 Status: $PM2_STATUS"
    else
        log_error "Backend health check failed!"
        log_error "Showing last 50 lines of logs:"
        ssh $SERVER "pm2 logs claudyne-backend --lines 50 --nostream"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    # Check file timestamps
    log_info "Checking file timestamps on server..."
    ssh $SERVER "ls -lh $FRONTEND_PATH/student-interface-modern.html $FRONTEND_PATH/sw.js" || log_warning "Some files missing"

    # Test public endpoint
    log_info "Testing public endpoint..."
    PUBLIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.claudyne.com/api/health)

    if [ "$PUBLIC_STATUS" == "200" ]; then
        log_success "Public API is accessible"
    else
        log_error "Public API returned status: $PUBLIC_STATUS"
    fi

    # Test Next.js routes if frontend was deployed
    log_info "Testing Next.js routes..."
    NEXTJS_PUBLIC=$(curl -sk https://www.claudyne.com/famille 2>&1 | grep -o 'id="__next"' || echo "")

    if [ -n "$NEXTJS_PUBLIC" ]; then
        log_success "Next.js routes are publicly accessible"
    else
        log_warning "Next.js routes not detected (may be using static HTML)"
    fi

    # Check PM2 status
    log_info "PM2 status:"
    ssh $SERVER "pm2 list"
}

# Run API contract tests
run_contract_tests() {
    log_info "Running API contract tests..."

    if [ -f "test-api-contracts.sh" ]; then
        if bash test-api-contracts.sh; then
            log_success "All API contracts validated ✅"
        else
            log_error "API contract tests FAILED ❌"
            log_error "Some endpoints do not respect conventions"
            log_warning "Review the test output above for details"
            return 1
        fi
    else
        log_warning "test-api-contracts.sh not found, skipping contract tests"
    fi
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."

    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "=========================================="
        echo "Claudyne Deployment Report"
        echo "Date: $(date)"
        echo "=========================================="
        echo ""
        echo "Deployed Files:"
        ssh $SERVER "ls -lh $FRONTEND_PATH/*.html $FRONTEND_PATH/sw.js 2>/dev/null"
        echo ""
        echo "Service Worker Version:"
        ssh $SERVER "grep 'CACHE_NAME =' $FRONTEND_PATH/sw.js | head -1"
        echo ""
        echo "Backend Status:"
        ssh $SERVER "pm2 status claudyne-backend"
        echo ""
        echo "Backend Health:"
        ssh $SERVER 'curl -s http://127.0.0.1:3001/api/health | jq .'
        echo ""
        echo "=========================================="
    } > "$REPORT_FILE"

    log_success "Report saved to: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Main script
main() {
    DEPLOY_TYPE="${1:-all}"

    echo ""
    log_info "=========================================="
    log_info "  Claudyne Deployment Script"
    log_info "=========================================="
    echo ""

    case $DEPLOY_TYPE in
        frontend)
            deploy_frontend
            ;;
        backend)
            deploy_backend
            ;;
        nextjs)
            deploy_nextjs
            ;;
        all)
            deploy_frontend
            deploy_backend
            deploy_nextjs
            ;;
        *)
            log_error "Invalid deployment type: $DEPLOY_TYPE"
            echo "Usage: $0 [frontend|backend|nextjs|all] [--bump-sw]"
            echo ""
            echo "Options:"
            echo "  frontend  - Deploy static HTML files (index.html, admin, etc.)"
            echo "  backend   - Deploy backend routes, models, middleware"
            echo "  nextjs    - Deploy Next.js application (frontend/)"
            echo "  all       - Deploy everything (frontend + backend + nextjs)"
            echo "  --bump-sw - Automatically bump service worker version"
            exit 1
            ;;
    esac

    verify_deployment

    # Run production health check if backend was deployed
    if [[ "$DEPLOY_TYPE" == "backend" || "$DEPLOY_TYPE" == "all" ]]; then
        log_info "Running production health check..."
        if [ -f "check-production.sh" ]; then
            if bash check-production.sh; then
                log_success "Production health check passed ✅"
            else
                log_error "Production health check detected issues ⚠️"
                log_warning "Review the check output above for details"
            fi
        else
            log_warning "check-production.sh not found, falling back to contract tests"
            run_contract_tests
        fi
    fi

    generate_report

    echo ""
    log_success "=========================================="
    log_success "  Deployment completed successfully!"
    log_success "=========================================="
    echo ""

    if [[ "$DEPLOY_TYPE" == "frontend" || "$DEPLOY_TYPE" == "all" ]]; then
        log_highlight "CRITICAL: Users must clear their browser cache!"
        log_highlight "Share this link: https://www.claudyne.com/clear-cache.html"
        echo ""

        # Show current SW version
        SW_VERSION=$(grep "CACHE_NAME =" sw.js 2>/dev/null | head -1 | sed "s/.*'\(.*\)'.*/\1/" || echo "unknown")
        log_info "Service Worker Version: $SW_VERSION"

        if [ "$BUMP_SW" = true ]; then
            log_warning "Don't forget to commit the new sw.js version!"
            echo ""
            echo "  git add sw.js"
            echo "  git commit -m 'chore: bump service worker to $SW_VERSION'"
        fi
    fi
    echo ""
}

# Run main script
main "$@"
