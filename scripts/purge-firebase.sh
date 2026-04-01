#!/bin/bash

# ⚡ UNY PROTOCOL: FIREBASE PURGE SCRIPT (V1)
# Description: Éradication totale de Firebase du projet.

echo "🔥 [Kernel] Starting Firebase Purge Protocol..."

# 1. Suppression des fichiers de configuration et de règles
echo "🗑️  Removing Firebase configuration files..."
rm -f firebase-applet-config.json
rm -f firebase-blueprint.json
rm -f firestore.rules
rm -f .firebaserc
rm -f firebase.json

# 2. Suppression du code source lié à Firebase
echo "🗑️  Removing Firebase source code..."
rm -f lib/firebase.ts
rm -f lib/firestore-service.ts
rm -f lib/firebase-admin.ts

# 3. Nettoyage de package.json (Désinstallation des packages)
echo "📦 Uninstalling Firebase dependencies..."
npm uninstall firebase firebase-admin react-firebase-hooks

# 4. Nettoyage du cache npm
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# 5. Message de confirmation
echo "✅ [Kernel] Firebase Purge Complete. The system is now 100% Supabase-native."
echo "🚀 Next step: Run 'npm install' to ensure a clean state."
