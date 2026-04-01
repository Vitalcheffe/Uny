# 🏗️ Architecture UNY

## System Overview

```
┌─────────────────────────────────────────────────┐
│ FRONTEND (Next.js + React)                     │
│ • Pages: Dashboard, Admin, Documents, etc.     │
│ • Components: shadcn/ui + custom               │
│ • State: Zustand + Supabase Realtime           │
└──────────────┬──────────────────────────────────┘
               │ tRPC (type-safe API)
┌──────────────▼──────────────────────────────────┐
│ BACKEND API (Node.js + Express)                │
│ • Auth: Supabase Auth (JWT)                    │
│ • Routes: /api/ner, /api/stripe, etc.          │
└──────────────┬──────────────────────────────────┘
               │
┌──────────┴────────────┐
│                       │
┌───▼──────────┐    ┌──────▼────────────────────┐
│ NER ENGINE   │    │ DATABASE (PostgreSQL)     │
│ (Python)     │    │ • Multi-tenant (RLS)      │
│ • spaCy      │    │ • Supabase Cloud          │
│ • Gemini API │    │ • Realtime subscriptions  │
└──────────────┘    └───────────────────────────┘
```

## Key Design Decisions

### 1. Multi-Tenancy via RLS
- Every table has `org_id` column
- RLS policies enforce `org_id = auth.uid_org_id()`
- Zero-trust: database enforces isolation

### 2. Secure Proxy Architecture
- All AI calls routed through backend
- NER detection before sending to OpenAI
- Token mapping stored encrypted locally
- Re-injection after AI response

### 3. Knowledge Graph
- Documents → Knowledge Atoms (extracted data)
- Atoms linked via Knowledge Edges
- Semantic search via embeddings (future)

## Data Flow Example

User uploads contract PDF:
1. Frontend → POST /api/documents/upload
2. Upload to Supabase Storage
3. Trigger webhook → Python NER service
4. Extract text (PyMuPDF)
5. Detect entities (Gemini + spaCy)
6. Create Knowledge Atoms in DB
7. Frontend polls/subscribes for completion
8. Display extracted data with source links
