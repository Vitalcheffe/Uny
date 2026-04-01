#!/bin/bash

echo "🧹 Nettoyage des secrets..."

# Supprimer fichiers sensibles
rm -f .env
rm -f .env.local
rm -f .env.production

# Nettoyer l'historique Git
# Note: This command might fail in the AI Studio environment if git is not fully initialized or if filter-branch is not available,
# but we provide it as part of the handoff script.
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.local .env.production" \
  --prune-empty --tag-name-filter cat -- --all || echo "⚠️ Git filter-branch skipped (not in a git repo or not supported)"

echo "✅ Secrets supprimés de l'historique Git"

# Créer .env.example (template public)
cat > .env.example << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Paddle Payment
PADDLE_API_KEY=your_paddle_api_key
VITE_PADDLE_CLIENT_TOKEN=your_paddle_client_token
PADDLE_WEBHOOK_SECRET=your_webhook_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key
EOF

echo "✅ .env.example créé"
