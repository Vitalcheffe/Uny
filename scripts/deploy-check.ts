/**
 * ⚡ UNY PROTOCOL: DEPLOYMENT CHECK SCRIPT (V1)
 * Description: Script de validation pré-build pour garantir l'intégrité et la sécurité.
 * Vérifie les variables d'env, les logs sensibles et le masquage PII.
 */

import * as fs from 'fs';
import * as path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const checkEnv = () => {
  console.log(`${YELLOW}⚡ [DeployCheck] Verifying Environment Variables...${RESET}`);
  const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'GEMINI_API_KEY'];
  const missing = requiredEnv.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error(`${RED}❌ [DeployCheck] Missing critical environment variables: ${missing.join(', ')}${RESET}`);
    return false;
  }
  console.log(`${GREEN}✅ [DeployCheck] Environment Variables: OK${RESET}`);
  return true;
};

const checkSensitiveLogs = () => {
  console.log(`${YELLOW}⚡ [DeployCheck] Scanning for sensitive console.log...${RESET}`);
  const srcDir = path.join(process.cwd(), 'src');
  let foundSensitive = false;

  const scanDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // On cherche des logs qui pourraient contenir des données sensibles
        if (content.includes('console.log(user)') || content.includes('console.log(profile)') || content.includes('console.log(password)')) {
          console.warn(`${YELLOW}⚠️ [DeployCheck] Potential sensitive log found in: ${fullPath}${RESET}`);
          foundSensitive = true;
        }
      }
    }
  };

  scanDir(srcDir);
  if (foundSensitive) {
    console.warn(`${YELLOW}⚠️ [DeployCheck] Sensitive logs found. Please review before production.${RESET}`);
  } else {
    console.log(`${GREEN}✅ [DeployCheck] Sensitive Logs: OK${RESET}`);
  }
  return true; // On ne bloque pas le build pour ça, mais on prévient.
};

const checkPIIMasking = () => {
  console.log(`${YELLOW}⚡ [DeployCheck] Verifying PII Masking coverage...${RESET}`);
  const srcDir = path.join(process.cwd(), 'src');
  let missingMasking = false;

  const scanDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // On cherche des appels à l'IA qui ne passeraient pas par le masqueur PII
        if (content.includes('generateContent') && !content.includes('maskPII')) {
          console.warn(`${RED}❌ [DeployCheck] IA call without PII Masking in: ${fullPath}${RESET}`);
          missingMasking = true;
        }
      }
    }
  };

  scanDir(srcDir);
  if (missingMasking) {
    console.error(`${RED}❌ [DeployCheck] PII Masking coverage is incomplete!${RESET}`);
    return false;
  }
  console.log(`${GREEN}✅ [DeployCheck] PII Masking: OK${RESET}`);
  return true;
};

const runAllChecks = () => {
  console.log(`${YELLOW}🚀 [DeployCheck] Starting Final Validation Protocol...${RESET}`);
  const envOk = checkEnv();
  const logsOk = checkSensitiveLogs();
  const piiOk = checkPIIMasking();

  if (envOk && logsOk && piiOk) {
    console.log(`${GREEN}🏁 [DeployCheck] All systems nominal. Ready for deployment.${RESET}`);
    process.exit(0);
  } else {
    console.error(`${RED}🛑 [DeployCheck] Deployment aborted due to critical errors.${RESET}`);
    process.exit(1);
  }
};

runAllChecks();
