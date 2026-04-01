# UNY Hub: System State & Governance Framework

## 🛡️ Core Architecture (Nervous System)

### 1. Authentication & Identity (`/context/AuthContext.tsx`)
- **Engine**: Firebase Auth (JWT-based).
- **Multi-Tenancy**: Level 4 isolation via `org_id` filtering.
- **Super Admin Protocol**: Root user `amineharchelkorane5@gmail.com` bypasses RLS.
- **Impersonation (Shadow View)**: Super Admin can view client sharding via `?orgId={ID}&impersonate=true&sk={SESSION_KEY}`.

### 2. Persistence Layer (`/firebase.ts`, `/lib/firestore-service.ts`)
- **Database**: Google Cloud Firestore.
- **Security**: Hardened Firestore Security Rules on all collections.
- **Risk Engine**: Automated calculation $R = \sum(v_i \cdot w_i) / c$.
- **OSINT Nexus**: Global event correlation table for predictive scaling.

### 3. Telemetry & Intelligence (`/lib/telemetry.ts`, `/pages/TelemetryCenter.tsx`)
- **Logging**: High-frequency asynchronous event capture.
- **Visualization**: Real-time time-series (AreaCharts) for frequency analysis.
- **Anomaly Detection**: AI-assisted resolution suggestions via Gemini.

## ⚖️ Compliance & Legal (CNDP Core)
- **Law 09-08**: Automated register of processing for DCP (Données à Caractère Personnel).
- **Data Sovereignty**: AES-256 encryption on sovereign buckets.
- **Auditability**: Immutable telemetry logs with session tracking.

## 🛠️ Interactive Station (`/pages/AdminCommand.tsx`)
- **Combat Station**: 4-column workstation for total oversight.
- **Interactive Terminal**: Command-line interface for deep audits and mission deployment.
- **NEXUS OSINT**: Real-time correlation of global cyber-threats with client sectors.

## 🚀 Deployment Mission
- **Atomic Provisioning**: Automated setup of organization modules and RLS rules.
- **Predictive Scaling**: Suggested quota increases based on historical telemetry trends.

---
*Last Updated: 2026-03-17 09:40 UTC*
*Status: PHASE 3 - AUTONOMOUS NERVOUS SYSTEM ACTIVE*
