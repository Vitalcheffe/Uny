# Contributing to UNY

Thank you for your interest in contributing to UNY — the Sovereign Operating System for African businesses.

## Getting Started

1. **Fork & clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Uny.git
   cd Uny
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Fill in your Supabase and API keys
   ```

3. **Run locally**
   ```bash
   npm run dev     # Frontend (Vite)
   npm run server  # Backend (Express)
   ```

## Development Workflow

- Create a feature branch: `git checkout -b feat/your-feature`
- Make changes and test: `npm test && npm run build`
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  ```
  feat(ner): add ICE number detection
  fix(paddle): correct webhook signature parsing
  test(auth): add login flow tests
  docs: update API reference
  ```
- Push and open a Pull Request

## Code Standards

- **TypeScript strict mode** — no `any` unless absolutely necessary
- **Components**: PascalCase (`DashboardHeader.tsx`)
- **Utilities**: camelCase (`ner-engine.ts`, `data-service.ts`)
- **Tests**: co-located or in `tests/` directory
- **Imports**: use absolute paths from project root

## Testing

```bash
npm test              # Run all tests
npx vitest run        # Same
npx vitest --coverage # With coverage report
```

All new features require tests. Bug fixes should include a regression test.

## Security

- Never commit `.env` files or API keys
- All PII handling must go through the NER Engine or PII Masker
- Supabase RLS policies must be respected
- Report security issues privately to contact@uny.ma

## Architecture

```
├── components/      # Reusable UI components
├── pages/           # Route-level page components
├── layouts/         # Layout wrappers
├── lib/             # Core services (Supabase, NER, Paddle)
├── services/        # Business logic layer
├── context/         # React context providers
├── types/           # TypeScript type definitions
├── supabase/        # Database migrations
├── tests/           # Test files
└── server.ts        # Express backend API
```
