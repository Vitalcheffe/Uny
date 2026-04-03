# UNY Phase 2 — Core Features Progress

## 📋 PHASE 2 STATUS

### What's Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| ReactFlow | ✅ Installed | v11.11.4 |
| Recharts | ✅ Installed | v2.13.0 |
| Mind Map Page | ✅ Exists | pages/MindMapPage.tsx |
| Dashboard Home | ✅ Exists | pages/DashboardHome.tsx with stat cards |
| AI Chat | ✅ Exists | NexusChatPage.tsx with PII masking stub |
| NER Engine | ✅ Implemented | lib/ner-engine.ts |
| PII Masker | ✅ Implemented | lib/pii-masker.ts |

### What's Needed

1. **Org Chart Onboarding** (Mind Map Enhancement)
   - Add image upload component to MindMapPage
   - Send to Gemini Vision with exact system prompt
   - Parse JSON response
   - Render as interactive reactflow mind map
   - Add "Invite employee" with tokens

2. **Company Dashboard** (Real Data)
   - Connect stat cards to Supabase queries
   - Add activity chart (30-day)
   - Team actions feed

3. **Sovereign AI Assistant**
   - Connect to Gemini/Claude API
   - Full PII masking round-trip
   - Conversation history in Supabase
   - Visual indicator "🔒 Data anonymized"

## 🔧 IMPLEMENTATION NOTES

### Current Codebase State

- **Onboarding**: 4-step flow exists, creates org in Supabase
- **Mind Map**: Loads profiles from Firestore, renders org chart
- **Dashboard**: Static cards with placeholder data
- **AI Chat**: Basic UI, POST to /api/ner/mask stub

### Files to Modify

1. `pages/MindMapPage.tsx` - Add upload flow
2. `pages/DashboardHome.tsx` - Connect to Supabase
3. `pages/NexusChatPage.tsx` - Full AI integration
4. Create `components/mindmap/OrgChartUploader.tsx`

## 📊 PHASE 2 ENTRY CHECKPOINT

```
npm run build: PASS
PII masker round-trip: PASS
No unhandled 404: Awaiting Vercel deploy (vercel.json committed)
```

---

## 🔜 NEXT STEPS

1. Add image upload flow to MindMapPage
2. Implement Gemini Vision integration
3. Connect dashboard to real Supabase data
4. Complete AI chat → Gemini/Claude integration