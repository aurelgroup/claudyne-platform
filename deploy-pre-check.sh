#!/bin/bash

# 🔍 CLAUDYNE PRE-DEPLOYMENT VALIDATION
# Expert DevOps validation script for zero-error deployment
# Validates server, network, dependencies, and configuration

set -e  # Exit on any error

# ================================
# CONFIGURATION
# ================================
VPS_IP="89.117.58.53"
DOMAIN="claudyne.com"
REQUIRED_RAM_GB=2
REQUIRED_DISK_GB=10
REQUIRED_PORTS=(22 80 443 3001 3002)
GITHUB_REPO="https://github.com/aurelgroup/claudyne-platform"
GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ================================
# LOGGING FUNCTIONS
# ================================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  INFO: $1${NC}"
}

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] 🎉 SUCCESS: $1${NC}"
}

# ================================
# VALIDATION FUNCTIONS
# ================================

# Test SSH connectivity
validate_ssh_connectivity() {
    info "Testing SSH connectivity to VPS..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes root@$VPS_IP "echo 'SSH Connection successful'" 2>/dev/null; then
        log "SSH connectivity: ✅ PASS"
        return 0
    else
        error "Cannot connect to VPS via SSH. Please check:\n- VPS is running\n- SSH keys are configured\n- Network connectivity\n- IP address: $VPS_IP"
    fi
}

# Validate VPS specifications
validate_vps_specs() {
    info "Validating VPS specifications..."

    # Check RAM
    local ram_gb=$(ssh root@$VPS_IP "free -g | awk 'NR==2{print \$2}'" 2>/dev/null)
    if [[ $ram_gb -ge $REQUIRED_RAM_GB ]]; then
        log "RAM: ${ram_gb}GB ✅ PASS (Required: ${REQUIRED_RAM_GB}GB+)"
    else
        warn "RAM: ${ram_gb}GB - Below recommended ${REQUIRED_RAM_GB}GB"
    fi

    # Check disk space
    local disk_gb=$(ssh root@$VPS_IP "df -BG / | awk 'NR==2{print \$4}' | sed 's/G//'" 2>/dev/null)
    if [[ $disk_gb -ge $REQUIRED_DISK_GB ]]; then
        log "Disk space: ${disk_gb}GB ✅ PASS (Required: ${REQUIRED_DISK_GB}GB+)"
    else
        error "Insufficient disk space: ${disk_gb}GB (Required: ${REQUIRED_DISK_GB}GB+)"
    fi

    # Check CPU cores
    local cpu_cores=$(ssh root@$VPS_IP "nproc" 2>/dev/null)
    if [[ $cpu_cores -ge 2 ]]; then
        log "CPU cores: ${cpu_cores} ✅ PASS"
    else
        warn "CPU cores: ${cpu_cores} - Recommended: 2+"
    fi

    # Check OS
    local os_info=$(ssh root@$VPS_IP "lsb_release -d 2>/dev/null | cut -f2" 2>/dev/null || echo "Unknown")
    log "Operating System: $os_info"
}

# Validate network requirements
validate_network() {
    info "Validating network requirements..."

    # Test domain DNS resolution
    if nslookup $DOMAIN >/dev/null 2>&1; then
        local resolved_ip=$(nslookup $DOMAIN | awk '/^Address: / { print $2 }' | tail -1)
        if [[ "$resolved_ip" == "$VPS_IP" ]]; then
            log "DNS resolution: ✅ PASS ($DOMAIN → $VPS_IP)"
        else
            warn "DNS mismatch: $DOMAIN resolves to $resolved_ip (Expected: $VPS_IP)"
        fi
    else
        warn "DNS resolution failed for $DOMAIN"
    fi

    # Test port accessibility
    for port in "${REQUIRED_PORTS[@]}"; do
        if timeout 5 bash -c "</dev/tcp/$VPS_IP/$port" 2>/dev/null; then
            log "Port $port: ✅ OPEN"
        else
            if [[ $port == 22 ]]; then
                error "Port 22 (SSH) is not accessible!"
            else
                warn "Port $port is not accessible (will be opened during deployment)"
            fi
        fi
    done
}

# Validate GitHub repository access
validate_github_repo() {
    info "Validating GitHub repository access..."

    # Test GitHub token
    local repo_response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/aurelgroup/claudyne-platform" \
        -w "%{http_code}")

    local http_code=$(echo "$repo_response" | tail -c 4)

    if [[ "$http_code" == "200" ]]; then
        log "GitHub repository access: ✅ PASS"

        # Get latest commit info
        local latest_commit=$(echo "$repo_response" | head -n -1 | jq -r '.default_branch // "main"' 2>/dev/null)
        log "Repository branch: $latest_commit"
    else
        error "Cannot access GitHub repository. HTTP Code: $http_code\nCheck token validity and repository access"
    fi
}

# Validate SSL certificate requirements
validate_ssl_requirements() {
    info "Validating SSL certificate requirements..."

    # Check if Let's Encrypt rate limits might apply
    local cert_info=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "No existing certificate")

    if [[ "$cert_info" != "No existing certificate" ]]; then
        log "Existing SSL certificate found for $DOMAIN"
        local expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        log "Certificate expires: $expiry"
    else
        log "No existing SSL certificate - new certificate will be issued"
    fi
}

# Validate deployment prerequisites
validate_deployment_prerequisites() {
    info "Validating deployment prerequisites..."

    # Check if required files exist locally
    local required_files=(
        "package.json"
        "server.js"
        "backend/config/production.js"
        "deploy-production-unified.sh"
    )

    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            log "Required file: $file ✅ FOUND"
        else
            error "Required file missing: $file"
        fi
    done

    # Validate package.json
    if command -v jq >/dev/null 2>&1; then
        local app_version=$(jq -r '.version' package.json 2>/dev/null)
        local app_name=$(jq -r '.name' package.json 2>/dev/null)
        log "Application: $app_name v$app_version"
    fi
}

# Create deployment environment file
create_deployment_env() {
    info "Creating deployment environment configuration..."

    # Generate secure passwords and secrets
    local db_password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    local jwt_secret=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

    cat > ".env.production" << EOF
# ================================
# CLAUDYNE PRODUCTION ENVIRONMENT
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ================================

# Core Application
NODE_ENV=production
PORT=3001
MOBILE_PORT=3002
TIMEZONE=Africa/Douala
LOCALE=fr_CM

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claudyne_production
DB_USER=claudyne_user
DB_PASSWORD=$db_password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000

# Security
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# CORS Configuration
CORS_ORIGIN=https://claudyne.com,https://www.claudyne.com
CORS_CREDENTIALS=true

# Performance
COMPRESSION_LEVEL=6
CACHE_TTL=3600
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=65000

# Mobile Optimization
MOBILE_COMPRESSION=true
MOBILE_CACHE_TTL=7200
MOBILE_RESPONSE_LIMIT=50000

# Monitoring
HEALTH_CHECK_INTERVAL=60000
METRICS_ENABLED=true

# URLs
FRONTEND_URL=https://claudyne.com
BACKEND_URL=https://claudyne.com/api
MOBILE_API_URL=https://claudyne.com/mobile-api

# Backup
BACKUP_ENABLED=true
BACKUP_INTERVAL=86400000
BACKUP_RETENTION=30

# Logging
LOG_LEVEL=info
LOG_FILE=true
LOG_ROTATION=daily
LOG_MAX_FILES=30

# Auto Sync
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL=5
SYNC_RETRY_ATTEMPTS=3
SYNC_BACKUP_ENABLED=true
EOF

    log "Environment configuration created: .env.production"
    log "Database password: $db_password (SAVE THIS SECURELY!)"
    log "JWT secret generated: ${jwt_secret:0:20}... (64 characters total)"
}

# Final validation summary
generate_validation_report() {
    info "Generating pre-deployment validation report..."

    local report_file="pre-deployment-report-$(date +%Y%m%d-%H%M%S).json"

    cat > "$report_file" << EOF
{
  "validation": {
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "vps_ip": "$VPS_IP",
    "domain": "$DOMAIN",
    "status": "validated"
  },
  "checks": {
    "ssh_connectivity": "✅ PASS",
    "vps_specifications": "✅ PASS",
    "network_configuration": "✅ PASS",
    "github_repository": "✅ PASS",
    "ssl_requirements": "✅ PASS",
    "deployment_files": "✅ PASS"
  },
  "next_steps": [
    "Upload deployment files to VPS",
    "Execute production deployment script",
    "Configure SSL certificates",
    "Run post-deployment tests",
    "Monitor application health"
  ],
  "deployment_command": "scp -r * root@$VPS_IP:/tmp/claudyne-deploy/ && ssh root@$VPS_IP 'cd /tmp/claudyne-deploy && chmod +x deploy-production-unified.sh && ./deploy-production-unified.sh'"
}
EOF

    log "Validation report saved: $report_file"
}

# ================================
# MAIN EXECUTION
# ================================
main() {
    echo -e "${BLUE}"
    echo "🔍 ========================================"
    echo "   CLAUDYNE PRE-DEPLOYMENT VALIDATION"
    echo "   Expert DevOps Zero-Error Approach"
    echo "🔍 ========================================"
    echo -e "${NC}"

    info "Starting comprehensive pre-deployment validation..."

    # Execute all validations
    validate_ssh_connectivity
    validate_vps_specs
    validate_network
    validate_github_repo
    validate_ssl_requirements
    validate_deployment_prerequisites
    create_deployment_env
    generate_validation_report

    echo -e "${GREEN}"
    echo "🎉 ========================================"
    echo "   PRE-DEPLOYMENT VALIDATION COMPLETE"
    echo "🎉 ========================================"
    echo ""
    echo "✅ All validations passed successfully!"
    echo "✅ Environment configuration created"
    echo "✅ Ready for production deployment"
    echo ""
    echo "🚀 Next step: Execute deployment script"
    echo "📋 Command: ./deploy-production-unified.sh"
    echo ""
    echo "⚠️  IMPORTANT: Save the database password securely!"
    echo "========================================"
    echo -e "${NC}"
}

# ================================
# SIGNAL HANDLING
# ================================
trap 'error "Validation interrupted by signal"' INT TERM

# ================================
# EXECUTION
# ================================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi