# UNY

<p align="center">
  <strong>Sovereign Operating System for African Businesses</strong>
</p>

<p align="center">
  <a href="https://github.com/Vitalcheffe/Uny/actions"><img src="https://img.shields.io/github/actions/workflow/status/Vitalcheffe/Uny/ci.yml?branch=main&style=for-the-badge" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT"></a>
  <a href="https://github.com/Vitalcheffe/Uny"><img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript"></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"></a>
</p>

UNY lets African businesses use global AI (ChatGPT, Claude, Gemini) while keeping their data sovereign. All sensitive data is anonymized before leaving the server. Loi 09-08 and RGPD compliant by design.

## What it does

- **Secure AI Proxy** — PII detection and anonymization (Moroccan CIN, ICE, phones, emails) before any data hits an external LLM
- **Multi-tenant OS** — CRM, Projects (Kanban + Gantt), Documents (OCR), Invoices, Treasury, Team management
- **NER Engine** — Dual-mode: Gemini AI for accuracy, regex fallback for reliability
- **Data sovereignty** — Your data stays on your infrastructure. Only anonymized text reaches external APIs

## Tech

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Express 5, Node.js 20 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Gemini 2.0, OpenAI GPT-4, Claude 3 Opus (fallback) |
| Payments | Paddle, Stripe |
| i18n | Auto-detect via IP (FR/EN), react-i18next |

## Quick start

```bash
git clone https://github.com/Vitalcheffe/Uny.git
cd Uny
npm install
cp .env.example .env
# Fill in your keys in .env
npm run dev
```

Visit http://localhost:3000

## Project structure

```
├── components/          # UI components
│   ├── admin/           # Admin panel components
│   ├── dashboard/       # Dashboard widgets
│   ├── ai/              # AI assistant components
│   └── marketing/       # Landing page
├── pages/               # Route pages
├── layouts/             # Layout wrappers
├── lib/                 # Core services
│   ├── supabase-client.ts   # Supabase init
│   ├── ner-engine.ts        # PII detection
│   ├── paddle-service.ts    # Payments
│   ├── email-service.ts     # Transactional email
│   └── pii-masker.ts        # Client-side masking
├── services/            # Business logic
├── context/             # React contexts
├── types/               # TypeScript types
├── supabase/migrations/ # DB migrations
├── tests/               # Test files
└── server.ts            # Express API
```

## Scripts

```bash
npm run dev         # Start Vite dev server
npm run server      # Start Express backend
npm run build       # Production build
npm test            # Run tests
npm run lint        # ESLint
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role key (server-side only) |
| `GEMINI_API_KEY` | Server | Gemini API key for NER engine |
| `PADDLE_API_KEY` | Server | Paddle API key |
| `VITE_PADDLE_CLIENT_TOKEN` | Yes | Paddle client token |
| `PADDLE_WEBHOOK_SECRET` | Server | Paddle webhook secret |

## Testing

```bash
npm test              # Run all tests
npx vitest run        # Same
npx vitest --coverage # With coverage
```

## License

[MIT](LICENSE)
