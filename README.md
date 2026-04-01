# 🏢 UNY - Sovereign Operating System for African Businesses

> **L'OS intelligent qui permet aux entreprises africaines d'utiliser l'IA mondiale (ChatGPT, Claude, Gemini) tout en gardant leurs données souveraines.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 Vision

UNY résout le paradoxe de l'IA en Afrique :
- ✅ Les entreprises VEULENT l'IA (productivité +40%)
- ❌ Les lois BLOQUENT l'utilisation (Loi 09-08, RGPD)
- ✅ UNY = Le pont légal entre les deux

**Notre solution : Secure Proxy + Multi-Tenant OS**

---

## 🚀 Features

### 🔐 Secure AI Proxy
- **Anonymisation automatique** des données sensibles (CIN, ICE, emails, téléphones)
- **NER Engine** multilingue (Français, Arabe, Darija)
- **Zero-knowledge architecture** : données sensibles ne quittent jamais le serveur local
- **Audit trail** complet pour conformité CNDP/DGSSI

### 🏢 Multi-Tenant OS
- **CRM** : Gestion clients avec AI sentiment analysis
- **Projects** : Kanban + Gantt + AI forecasting
- **Documents** : OCR + extraction automatique (Knowledge Atoms)
- **Invoices** : Facturation auto + payment prediction
- **Treasury** : Cash flow + forecast 90 jours
- **Team** : Org chart 3D + performance tracking

### 👑 Super Admin
- **Audit Pipeline** : Validation entreprises (Landing → Onboarding automatique)
- **Multi-Org Control** : Suspend/Activate organizations
- **Quota Management** : Limites IA + Storage par entreprise
- **Billing Dashboard** : MRR tracking (Paddle integration)

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript 5
- Tailwind CSS + shadcn/ui
- React Three Fiber (3D visualizations)
- Framer Motion (animations)

**Backend:**
- Node.js 20 (Express server)
- Supabase (PostgreSQL 15 + Auth + Storage + Realtime)
- Python 3.11 (NER Engine via FastAPI)

**AI/ML:**
- Gemini 2.0 Flash (NER + document analysis)
- OpenAI GPT-4 (fallback)
- Claude 3 Opus (fallback)

**Payments:**
- Paddle (subscription management)

**Infrastructure:**
- Vercel (Frontend hosting)
- Railway (Backend API)
- Supabase Cloud (Database + Auth)

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- Paddle account (for payments)
- Gemini API key

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/VitalCheffe/Uny.git
cd Uny
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your actual keys
```

4. **Run database migrations**
```bash
npx supabase db push
```

5. **Start development server**
```bash
npm run dev
```

6. **Start backend server (separate terminal)**
```bash
npm run server
```

Visit http://localhost:5173

## 🗄️ Database Schema
Key tables:
- `organizations` - Multi-tenant orgs
- `profiles` - User accounts with RLS
- `documents` - File storage with AI metadata
- `knowledge_atoms` - Extracted data points
- `audit_requests` - Landing page submissions
- `invitations` - Onboarding tokens
See `supabase/migrations/` for full schema.

## 🔐 Security
- Row Level Security (RLS) on all tables
- Multi-tenant isolation via `org_id` policies
- Encrypted secrets (AES-256 for token mappings)
- Audit logging (immutable blockchain-style)
- CORS protection on API routes
- Rate limiting (100 req/min per IP)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📚 Documentation
- [Architecture Overview](docs/ARCHITECTURE.md)
- API Reference
- Deployment Guide
- Contributing

## 🤝 Contributing
We welcome contributions! See `CONTRIBUTING.md` for guidelines.

## 📄 License
MIT License - see LICENSE file for details.

## 🙏 Acknowledgments
- Built with ❤️ in Casablanca, Morocco
- Powered by Supabase, Vercel, and Google AI

## 📞 Contact
- Email: contact@uny.ma
- GitHub: @VitalCheffe
- Twitter: @UNY_OS
