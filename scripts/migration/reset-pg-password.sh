#!/bin/bash
# Script pour réinitialiser le mot de passe PostgreSQL

echo "🔐 Réinitialisation du mot de passe PostgreSQL..."

# Réinitialiser le mot de passe
sudo -u postgres psql -c "ALTER USER claudyne_user WITH PASSWORD 'aujourdhui18D@';"

if [ $? -eq 0 ]; then
    echo "✅ Mot de passe réinitialisé avec succès"

    # Tester la connexion
    echo "🧪 Test de connexion..."
    PGPASSWORD='aujourdhui18D@' psql -U claudyne_user -d claudyne_prod -h localhost -c "SELECT COUNT(*) as total_users FROM users;"

    if [ $? -eq 0 ]; then
        echo "✅ Connexion réussie !"
    else
        echo "❌ Connexion échouée"
    fi
else
    echo "❌ Erreur lors de la réinitialisation"
fi
