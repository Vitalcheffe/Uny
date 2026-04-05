# AGENTS.md — UNY Project Intelligence

> Read this file FIRST before touching any code.
> Follow every instruction strictly.

## Project Identity
- Name: UNY — Sovereign Operating System for African Businesses
- Stack: React 18, TypeScript, Vite, Tailwind CSS, Supabase, Express
- Deployed: uny-gamma.vercel.app
- Repo: github.com/Vitalcheffe/Uny
- Branch: main (always push here)

## Critical Rules
1. NEVER batch commits — one file = one commit = one push
2. ALWAYS run `npx tsc --noEmit` after every change
3. NEVER push if TypeScript errors exist
4. ALWAYS run `npm run build` locally before pushing
5. If build fails on Vercel — fix immediately, 
 do not move to next task

## Architecture
- SuperAdmin route: /dashboard → layouts/SuperAdminLayout.tsx
- User route: /app → layouts/UserLayout.tsx
- Auth: Supabase Auth, roles in app_metadata
- SuperAdmin detection: user.app_metadata.role === 'SUPER_ADMIN'
- Routing logic: App.tsx → RootProtocol component

## Routing Logic (CRITICAL)
- Unauthenticated → LandingPage at /
- SuperAdmin authenticated → /dashboard (SuperAdminLayout)
- Regular user authenticated → /app (UserLayout)
- Onboarding: only shown ONCE (localStorage key: uny_onboarding_done)
- Gate: /Gate_X92 → hidden admin login page

## Auth Credentials (dev)
- SuperAdmin email: amineharchelkorane5@gmail.com
- SuperAdmin role set in: Supabase Auth → app_metadata.role

## Supabase
- Project: bbphxrxcznuuozlypjul
- URL: https://bbphxrxcznuuozlypjul.supabase.co
- Tables: profiles, organizations, audit_requests, 
 auth_invitations
- Key issue: profiles table uses user_id not id 
 as the user reference column
- RLS: enabled on all tables
- Migrations: supabase/migrations/

## Current Known Issues (fix these first)
1. White screen on login — likely broken import 
 in App.tsx or missing component file
2. Audit request form fails — audit_requests 
 table may need RLS policy for anon INSERT
3. Mobile scroll blocked — check for 
 overflow:hidden on body/root

## Design System (non-negotiable)
- Background: #FFFFFF
- Sidebar: #0A0A1A
- Sidebar active: white text + #2563EB left border
- Cards: #F8FAFC, border #E2E8F0, radius 16px
- Primary: #2563EB
- Danger: #EF4444
- Success: #10B981
- Font: Inter (Google Fonts)
- No gradients on UI elements
- Icons: lucide-react only

## SuperAdmin Dashboard (/dashboard)
Sidebar: Audits | Entreprises | Utilisateurs | Paramètres
Pages:
- /dashboard/audits: pending requests table, 
 approve/reject buttons
- /dashboard/companies: orgs table + right drawer 
 with tabs (Aperçu/Tokens/Utilisateurs/Paiements)
- /dashboard/users: all users table
- /dashboard/settings: platform config

## User Dashboard (/app)
Sidebar: Accueil | Chat IA | Documents | 
 Projets | Équipe | Facturation
- /app: home with stats + activity
- /app/chat: AI proxy chat (Claude/GPT/Gemini)
- /app/documents|projects|team|billing: 
 clean "coming soon" states

## File Structure
layouts/
 SuperAdminLayout.tsx
 UserLayout.tsx
pages/
 admin/
 AuditsPage.tsx
 CompaniesPage.tsx
 UsersPage.tsx
 user/
 HomePage.tsx
 ChatPage.tsx
 DocumentsPage.tsx (coming soon)
 ProjectsPage.tsx (coming soon)
 TeamPage.tsx (coming soon)
 BillingPage.tsx (coming soon)
 LandingPage.tsx
 OnboardingPage.tsx
 Gate_X92.tsx

## How to Start Each Session
1. Read this file completely
2. Run: git log --oneline -5 (see recent commits)
3. Run: npx tsc --noEmit (check errors)
4. Run: npm run build (check build)
5. Fix errors BEFORE doing anything else
6. Then execute your assigned task

## Commit Format
feat(scope): description
fix(scope): description
Examples:
 feat(dashboard): audits page complete
 fix(routing): white screen on login
 fix(build): typescript error OnboardingPage

---