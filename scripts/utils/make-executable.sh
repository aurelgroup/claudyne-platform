#!/bin/bash

# 🔧 CLAUDYNE - MAKE SCRIPTS EXECUTABLE
# Script pour rendre tous les scripts de déploiement exécutables

echo "🔧 Making Claudyne deployment scripts executable..."

# Make deployment scripts executable
chmod +x deploy-pre-check.sh
chmod +x deploy-production-expert.sh
chmod +x deploy-commands.sh
chmod +x deploy-production-unified.sh

# Make this script executable too
chmod +x make-executable.sh

echo "✅ All deployment scripts are now executable!"
echo ""
echo "📋 Available scripts:"
echo "  - deploy-pre-check.sh         (Pre-deployment validation)"
echo "  - deploy-production-expert.sh (Expert deployment with rollback)"
echo "  - deploy-commands.sh          (Interactive deployment commands)"
echo "  - deploy-production-unified.sh (Original deployment script)"
echo ""
echo "🚀 Ready for deployment! Run: ./deploy-commands.sh auto"