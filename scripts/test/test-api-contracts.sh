#!/bin/bash
###############################################################################
# Test de Contrat API Claudyne
# Vérifie que tous les endpoints respectent leurs contrats
# À lancer après chaque déploiement pour détecter les régressions
###############################################################################

set -e  # Arrêter en cas d'erreur

API_URL="https://claudyne.com/api"
ADMIN_KEY="claudyne-admin-2024"
ERRORS=0

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction pour vérifier qu'une réponse contient un tableau
assert_array() {
    local response="$1"
    local endpoint="$2"

    if echo "$response" | grep -q '"data":\['; then
        print_success "[$endpoint] data est un tableau"
        return 0
    else
        print_error "[$endpoint] data n'est PAS un tableau"
        echo "    Réponse: $(echo "$response" | head -c 200)"
        return 1
    fi
}

# Fonction pour vérifier qu'une réponse contient un objet
assert_object() {
    local response="$1"
    local endpoint="$2"

    if echo "$response" | grep -q '"data":{'; then
        print_success "[$endpoint] data est un objet"
        return 0
    else
        print_error "[$endpoint] data n'est PAS un objet"
        echo "    Réponse: $(echo "$response" | head -c 200)"
        return 1
    fi
}

# Fonction pour vérifier le success
assert_success() {
    local response="$1"
    local endpoint="$2"

    if echo "$response" | grep -q '"success":true'; then
        print_success "[$endpoint] success: true"
        return 0
    else
        print_error "[$endpoint] success n'est pas true"
        echo "    Réponse: $(echo "$response" | head -c 200)"
        return 1
    fi
}

# Fonction pour vérifier le status HTTP
assert_status() {
    local status="$1"
    local expected="$2"
    local endpoint="$3"

    if [ "$status" -eq "$expected" ]; then
        print_success "[$endpoint] Status HTTP: $status"
        return 0
    else
        print_error "[$endpoint] Status HTTP attendu $expected, reçu $status"
        return 1
    fi
}

###############################################################################
# TESTS
###############################################################################

print_header "TEST DE CONTRAT API CLAUDYNE"
print_info "Date: $(date)"
print_info "API URL: $API_URL"

###############################################################################
# 1. HEALTH CHECK
###############################################################################
print_header "1. Health Check"

print_test "GET /health"
response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

assert_status "$http_code" 200 "/health"
if echo "$body" | grep -q '"status":"healthy"'; then
    print_success "[/health] Status: healthy"
else
    print_error "[/health] Status n'est pas healthy"
    echo "    Réponse: $body"
fi

###############################################################################
# 2. ADMIN TOKEN GENERATION
###############################################################################
print_header "2. Admin Authentication"

print_test "POST /admin/generate-token"
response=$(curl -s "$API_URL/admin/generate-token" \
    -H "Content-Type: application/json" \
    -d "{\"adminKey\":\"$ADMIN_KEY\"}")

assert_success "$response" "/admin/generate-token"

TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "[/admin/generate-token] Token non généré"
    echo "Impossible de continuer les tests admin"
    exit 1
else
    print_success "[/admin/generate-token] Token généré: ${TOKEN:0:30}..."
fi

###############################################################################
# 3. ADMIN CONTENT ENDPOINTS (TAB-BASED)
###############################################################################
print_header "3. Admin Content Endpoints (/:tab)"

# 3.1 Courses
print_test "GET /admin/content/courses"
response=$(curl -s "$API_URL/admin/content/courses" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

assert_success "$response" "/admin/content/courses"
assert_array "$response" "/admin/content/courses"

# Vérifier qu'au moins les propriétés attendues existent
if echo "$response" | grep -q '"id":'; then
    print_success "[/admin/content/courses] Contient des objets avec 'id'"
else
    print_error "[/admin/content/courses] Ne contient pas d'objets avec 'id'"
fi

# 3.2 Quizzes
print_test "GET /admin/content/quizzes"
response=$(curl -s "$API_URL/admin/content/quizzes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

assert_success "$response" "/admin/content/quizzes"
assert_array "$response" "/admin/content/quizzes"

# 3.3 Resources
print_test "GET /admin/content/resources"
response=$(curl -s "$API_URL/admin/content/resources" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

assert_success "$response" "/admin/content/resources"
assert_array "$response" "/admin/content/resources"

###############################################################################
# 4. ADMIN CONTENT GLOBAL
###############################################################################
print_header "4. Admin Content Global"

print_test "GET /admin/content"
response=$(curl -s "$API_URL/admin/content" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

assert_success "$response" "/admin/content"
assert_object "$response" "/admin/content"

# Vérifier la structure attendue
if echo "$response" | grep -q '"subjects"'; then
    print_success "[/admin/content] Contient 'subjects'"
else
    print_error "[/admin/content] Ne contient pas 'subjects'"
fi

if echo "$response" | grep -q '"stats"'; then
    print_success "[/admin/content] Contient 'stats'"
else
    print_error "[/admin/content] Ne contient pas 'stats'"
fi

###############################################################################
# 5. PUBLIC CONTENT
###############################################################################
print_header "5. Public Content Endpoints"

print_test "GET /public/content"
response=$(curl -s "$API_URL/public/content")

assert_success "$response" "/public/content"
assert_object "$response" "/public/content"

if echo "$response" | grep -q '"courses"'; then
    print_success "[/public/content] Contient 'courses'"
else
    print_error "[/public/content] Ne contient pas 'courses'"
fi

###############################################################################
# 6. STUDENT ENDPOINTS (requires real student token)
###############################################################################
print_header "6. Student Endpoints Structure"

print_info "Ces endpoints nécessitent un token étudiant réel"
print_info "On vérifie juste qu'ils répondent correctement en cas d'erreur"

print_test "GET /students/profile (sans token)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/students/profile")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

assert_status "$http_code" 401 "/students/profile"
if echo "$body" | grep -q '"success":false'; then
    print_success "[/students/profile] Rejette correctement sans token"
else
    print_error "[/students/profile] Ne rejette pas correctement"
fi

print_test "GET /students/subjects (sans token)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/students/subjects")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

assert_status "$http_code" 401 "/students/subjects"

###############################################################################
# 7. AUTHENTICATION ENDPOINTS
###############################################################################
print_header "7. Authentication Structure"

print_test "POST /auth/login (credentials invalides)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"fake@test.com","password":"wrong"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# Devrait être 401 (Unauthorized) ou 400 (Bad Request)
if [ "$http_code" -eq 401 ] || [ "$http_code" -eq 400 ]; then
    print_success "[/auth/login] Rejette correctement les credentials invalides (HTTP $http_code)"
else
    print_error "[/auth/login] Status HTTP inattendu: $http_code"
fi

if echo "$body" | grep -q '"success":false'; then
    print_success "[/auth/login] Retourne success: false"
else
    print_error "[/auth/login] Ne retourne pas success: false"
fi

###############################################################################
# 8. CONVENTIONS API GLOBALES
###############################################################################
print_header "8. Conventions API Globales"

print_info "Vérification des conventions sur tous les endpoints testés:"

echo ""
echo "CONVENTION #1: Tous les endpoints doivent retourner { success: boolean }"
if [ $ERRORS -eq 0 ]; then
    print_success "Tous les endpoints testés respectent cette convention"
else
    print_error "Certains endpoints ne respectent pas cette convention"
fi

echo ""
echo "CONVENTION #2: GET /collection → data: []"
echo "CONVENTION #3: GET /single → data: {}"
print_info "Vérifiées dans les tests ci-dessus"

###############################################################################
# RÉSUMÉ
###############################################################################
print_header "RÉSUMÉ DES TESTS"

if [ $ERRORS -eq 0 ]; then
    echo ""
    print_success "=========================================="
    print_success "  TOUS LES TESTS RÉUSSIS! ✅"
    print_success "  L'API respecte tous ses contrats"
    print_success "=========================================="
    echo ""
    exit 0
else
    echo ""
    print_error "=========================================="
    print_error "  $ERRORS ERREUR(S) DÉTECTÉE(S) ❌"
    print_error "  Des contrats API sont violés"
    print_error "=========================================="
    echo ""
    print_info "Recommandations:"
    echo "  1. Vérifier les logs backend pour plus de détails"
    echo "  2. Comparer avec la documentation API"
    echo "  3. Corriger les endpoints problématiques"
    echo "  4. Relancer ce test après corrections"
    echo ""
    exit 1
fi
