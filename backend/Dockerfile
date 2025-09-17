# Multi-stage Dockerfile pour Claudyne Backend
# Optimisé pour production et réseaux 2G/3G Cameroun

# ================================
# Stage 1: Builder
# ================================
FROM node:18-alpine AS builder

# Métadonnées
LABEL maintainer="Claudyne Education <admin@claudyne.com>"
LABEL description="Backend API Claudyne - Plateforme éducative Cameroun"
LABEL version="1.0.0"

# Variables d'environnement de build
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Création de l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S claudyne -u 1001

# Répertoire de travail
WORKDIR /app

# Installation des dépendances système nécessaires
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata

# Configuration timezone Cameroun
ENV TZ=Africa/Douala
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --only=production --silent && \
    npm cache clean --force

# ================================
# Stage 2: Production
# ================================
FROM node:18-alpine AS production

# Métadonnées
LABEL maintainer="Claudyne Education <admin@claudyne.com>"
LABEL description="Backend API Claudyne - Production Ready"

# Variables d'environnement production
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Création de l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S claudyne -u 1001

# Installation des utilitaires système
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata

# Configuration timezone
ENV TZ=Africa/Douala
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Répertoire de travail
WORKDIR /app

# Copie des dépendances depuis le builder
COPY --from=builder --chown=claudyne:nodejs /app/node_modules ./node_modules

# Copie du code source
COPY --chown=claudyne:nodejs . .

# Création des répertoires nécessaires
RUN mkdir -p logs public/uploads database && \
    chown -R claudyne:nodejs logs public/uploads database

# Configuration sécurisée
RUN chmod -R 755 /app && \
    chmod -R 750 logs public/uploads database

# Exposition du port
EXPOSE 3001

# Health check optimisé
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Passage à l'utilisateur non-root
USER claudyne

# Démarrage avec dumb-init pour gestion des signaux
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]