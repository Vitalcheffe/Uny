# 🚀 UNY.2100 PRODUCTION DEPLOYMENT GUIDE

Follow these steps to transition the **UNY.2100 Command Center** from alpha development to a live production environment (Vercel/Netlify).

---

## 1️⃣ ENVIRONMENT CONFIGURATION

Create a `.env.production` file in your project root or add these variables directly to your hosting provider's dashboard (Vercel/Netlify).

```env
VITE_SUPABASE_URL=https://ncbfeoubniltkoirpxjj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable__QPViYma_0kR4yM8Slvn0Q_my-uCO7J
```

> **Note:** For security, ensure `VITE_SUPABASE_ANON_KEY` is your **Anon/Public** key, never your `service_role` key.

---

## 2️⃣ VERCEL DEPLOYMENT (Command Line)

The fastest way to deploy UNY is using the Vercel CLI.

### Install & Login
```bash
npm install -g vercel
vercel login
```

### Deploy
Run this in the root of the project:
```bash
vercel --prod
```

### Configure Variables (If not done via Dashboard)
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

---

## 3️⃣ SUPABASE PRODUCTION SETUP

To ensure the authentication flow and data isolation work correctly on your live URL:

### 🌐 URL Configuration
1. Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. **Site URL**: Set to your production URL (e.g., `https://uny-alpha.vercel.app`).
3. **Redirect URLs**: Add your production URL followed by `/**` (e.g., `https://uny-alpha.vercel.app/**`).

### 🛡️ Security Hardening (RLS)
Ensure the `database_schema.sql` was executed. All tables MUST have Row Level Security enabled.
To verify, run this in the Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
*Result should show `true` for all tables.*

---

## 4️⃣ POST-DEPLOYMENT VERIFICATION

Once the URL is live, perform the **Smoke Test**:

1.  **Identity**: Clear browser cache, go to your live URL, and register a new commander.
2.  **Redirect**: Verify you are redirected to `/onboarding` upon first login.
3.  **Sync**: Complete onboarding and ensure the "Neuro-Syncing" phase successfully writes to the database.
4.  **Isolation**: Login with a second device/incognito and verify User A cannot see User B's telemetry or projects.

---
**UNY Build Certified for Production.**
*URL Template: https://[your-project-name].vercel.app*