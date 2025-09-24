# Script PowerShell pour connexion EAS
$email = "marchekamna@gmail.com"
$password = "Lamino12@"

Write-Host "=== CONNEXION EAS CLAUDYNE ==="
Write-Host "Email: $email"

# Tentative de connexion
$process = Start-Process -FilePath "eas" -ArgumentList "login" -PassThru -NoNewWindow -RedirectStandardInput "input.txt"

# Créer fichier d'entrée
"$email`n$password" | Out-File -FilePath "input.txt" -Encoding ASCII

# Attendre la fin
$process.WaitForExit()

Write-Host "Processus terminé avec code: " $process.ExitCode