# ==========================================
#    SCRIPT DEPLOY GITHUB + PRODUCTION
#    Claudyne Platform
# ==========================================

Write-Host "🚀 ========================================" -ForegroundColor Cyan
Write-Host "   DEPLOY CLAUDYNE - GITHUB + PRODUCTION" -ForegroundColor Cyan
Write-Host "🚀 ========================================" -ForegroundColor Cyan
Write-Host "👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine" -ForegroundColor Yellow
Write-Host ""

# Variables
$VPS_IP = "89.117.58.53"
$VPS_USER = "root"
$REPO_URL = "https://github.com/aurelgroup/claudyne-platform"

# Étape 1: Vérification Git
Write-Host "🔍 Vérification du statut Git..." -ForegroundColor Blue
git status --porcelain
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur Git" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer..."
    exit 1
}

# Étape 2: Add et Commit
Write-Host ""
Write-Host "📝 Ajout des fichiers modifiés..." -ForegroundColor Blue
git add .

$commitMsg = Read-Host "💬 Message de commit"
if ([string]::IsNullOrEmpty($commitMsg)) {
    $commitMsg = "🔐✨ Nouvelles fonctionnalités - Sécurité & Abonnement Premium"
}

Write-Host "📤 Création du commit..." -ForegroundColor Blue
git commit -m "$commitMsg"

# Étape 3: Push vers GitHub
Write-Host ""
Write-Host "📤 Push vers GitHub..." -ForegroundColor Blue
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du push GitHub" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer..."
    exit 1
}

Write-Host "✅ Push GitHub réussi!" -ForegroundColor Green

# Étape 4: Déploiement sur le serveur
Write-Host ""
Write-Host "🚀 Déploiement sur le serveur $VPS_IP..." -ForegroundColor Blue

# Déploiement direct des fichiers statiques
Write-Host "⚡ Déploiement des fichiers sur le serveur..." -ForegroundColor Blue
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/html && git pull origin main && systemctl reload nginx"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 ========================================" -ForegroundColor Green
    Write-Host "   DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !" -ForegroundColor Green
    Write-Host "🎉 ========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URLs actives:" -ForegroundColor Cyan
    Write-Host "   🏠 Principal: https://claudyne.com" -ForegroundColor White
    Write-Host "   👨‍💼 Admin: https://claudyne.com/admin" -ForegroundColor White
    Write-Host "   🎓 Étudiant: https://claudyne.com/student" -ForegroundColor White
    Write-Host "   🔗 API: https://claudyne.com/api" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Repository: $REPO_URL" -ForegroundColor Cyan
    Write-Host "👨‍👩‍👧‍👦 'La force du savoir en héritage'" -ForegroundColor Yellow
} else {
    Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer..."