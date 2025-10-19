# Script PowerShell de déploiement rapide - Corrections Interface Student
# Date: 19 Octobre 2025
# Exécuter depuis: C:\Users\fa_nono\Documents\CADD\Claudyne
# Usage: .\DEPLOIEMENT_RAPIDE.ps1

Write-Host "🚀 Déploiement des corrections Interface Student" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER = "root@89.117.58.53"
$REMOTE_PATH = "/opt/claudyne"
$LOCAL_PATH = "C:\Users\fa_nono\Documents\CADD\Claudyne"

# Étape 1: Sauvegarde
Write-Host "Étape 1/5: Sauvegarde des fichiers existants sur le serveur" -ForegroundColor Blue
ssh $SERVER "cd $REMOTE_PATH && cp student-interface-modern.html student-interface-modern.html.backup.`$(date +%Y%m%d_%H%M%S) && cp backend/src/routes/students.js backend/src/routes/students.js.backup.`$(date +%Y%m%d_%H%M%S)"
Write-Host "✅ Sauvegardes créées`n" -ForegroundColor Green

# Étape 2: Upload frontend
Write-Host "Étape 2/5: Upload des fichiers frontend" -ForegroundColor Blue
scp "$LOCAL_PATH\student-interface-modern.html" "${SERVER}:${REMOTE_PATH}/"
scp "$LOCAL_PATH\student-payment-modal.js" "${SERVER}:${REMOTE_PATH}/"
Write-Host "✅ Fichiers frontend uploadés`n" -ForegroundColor Green

# Étape 3: Upload backend
Write-Host "Étape 3/5: Upload des fichiers backend" -ForegroundColor Blue
scp "$LOCAL_PATH\backend\src\routes\students.js" "${SERVER}:${REMOTE_PATH}/backend/src/routes/"
Write-Host "✅ Fichiers backend uploadés`n" -ForegroundColor Green

# Étape 4: Redémarrage serveur
Write-Host "Étape 4/5: Redémarrage du serveur backend" -ForegroundColor Blue
ssh $SERVER "cd $REMOTE_PATH/backend && pkill -f 'node.*server.js' && sleep 2 && nohup node src/server.js > logs/server.log 2>&1 & && sleep 3 && ps aux | grep 'node.*server.js' | grep -v grep"
Write-Host "✅ Serveur backend redémarré`n" -ForegroundColor Green

# Étape 5: Vérification logs
Write-Host "Étape 5/5: Vérification des logs" -ForegroundColor Blue
ssh $SERVER "tail -n 20 $REMOTE_PATH/backend/logs/combined.log"
Write-Host "✅ Logs vérifiés`n" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "✅ DÉPLOIEMENT TERMINÉ" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Prochaines étapes:"
Write-Host "  1. Ouvrir https://claudyne.com/student-interface-modern.html"
Write-Host "  2. Se connecter avec un compte test"
Write-Host "  3. Vérifier que les données sont réelles"
Write-Host "  4. Tester le bouton 'Renouveler mon abonnement'"
Write-Host "  5. Vérifier la console (F12) pour les erreurs"
Write-Host ""
Write-Host "📚 Documentation complète: DEPLOIEMENT_CORRECTIONS_FINAL.md"
Write-Host ""

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "  Le HTML du modal de paiement doit être inséré manuellement"
Write-Host "  dans student-interface-modern.html après le modal de mot de passe"
Write-Host ""
Write-Host "  Commande:"
Write-Host "  ssh $SERVER"
Write-Host "  nano $REMOTE_PATH/student-interface-modern.html"
Write-Host "  # Chercher la ligne ~4091 (fin du modal de mot de passe)"
Write-Host "  # Insérer le contenu de payment-modal.html"
Write-Host ""

# Ouvrir le navigateur pour tester
$response = Read-Host "Voulez-vous ouvrir l'interface dans le navigateur maintenant? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
    Start-Process "https://claudyne.com/student-interface-modern.html"
}

Write-Host ""
Write-Host "✨ Déploiement terminé avec succès!" -ForegroundColor Green
