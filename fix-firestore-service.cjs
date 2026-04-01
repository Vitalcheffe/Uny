const fs = require('fs');
const content = fs.readFileSync('lib/firestore-service.ts', 'utf8');
const fixed = content.replace(/supabase\.from\(collectionName\)/g, 'supabase.from(collectionName as any)');
fs.writeFileSync('lib/firestore-service.ts', fixed);
