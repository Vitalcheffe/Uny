import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translations
const resources = {
  en: {
    translation: {
      nav: {
        features: "Features",
        benefits: "Benefits",
        pricing: "Pricing",
        login: "Client Portal",
        audit: "Request Audit",
        infrastructure: "Infrastructure",
        capabilities: "Capabilities",
        access: "Access",
        compliance: "Compliance",
        clientArea: "Client Area",
        requestAudit: "Request Audit"
      },
      hero: {
        title1: "Sovereign Business",
        title2: "Orchestration",
        subtitle: "The Enterprise Operating System designed for the premium B2B market. Data governance, compliance, and cognitive infrastructure.",
        btnAudit: "Request My Audit",
        btnFeatures: "Discover Infrastructure"
      },
      trusted: {
        title: "The trusted infrastructure of industry leaders"
      },
      multiDevice: {
        tag: "Operational Continuity",
        title1: "Secure access,",
        title2: "anywhere, anytime",
        desc: "Access your enterprise ecosystem from your pocket. Our mobile experience is as powerful as the desktop hub, with end-to-end security.",
        mobile: "Mobile App",
        web: "Web App"
      },
      projectMgmt: {
        tag: "Project Management",
        title1: "Keep every project",
        title2: "on track",
        desc: "Plan, assign, and deliver your work - all in one place. With intelligent tracking of tasks, deadlines, and real-time progress, you stay organized and your clients stay confident.",
        btn: "Initialize Project",
        items: ["Tasks", "Time Tracking", "Timesheets", "Reports"]
      },
      financials: {
        tag: "Financial Management",
        title1: "Track revenue,",
        title2: "get paid, stress-free",
        desc: "Create branded invoices, log expenses, and keep an eye on your earnings. Whether you bill hourly or per project, everything is automated and optimized for tax compliance.",
        items: ["Invoicing", "Budgets", "Forecasting", "Integrations"],
        balance: "Balance"
      },
      scanner: {
        tag: "Advanced Logic Processor",
        title1: "Deep Context",
        title2: "Scanner",
        desc: "Transform chaos into surgical intelligence. Hover over the raw stream to freeze the flux and activate the Gemini Extraction Layer.",
        statusLocked: "SIGNAL LOCKED",
        statusAwaiting: "AWAITING INTERCEPTION",
        logic: "Extraction Logic: Gemini-3",
        intercepting: "Intercepting chaotic signals...",
        insights: "Surgical Insights Detected",
        anomaly: "High Risk Anomaly",
        anomalyTitle: "Duplicate Invoice Detected",
        anomalyDesc: "#INV-2909 matches patterns of #INV-2908",
        shift: "Operational Shift",
        shiftTitle: "Logistics Rotation Alert",
        shiftDesc: "Optimization Node suggested for Vector-7",
        fusion: "Entity Fusion",
        fusionTitle: "New Client Node Verified",
        fusionDesc: "Sentiment calibration: Nameinal (84%)"
      },
      architecture: {
        tag: "UNY Architecture",
        title1: "Designed for the elite,",
        title2: "powered by simplicity",
        desc: "Intelligent, flexible, and built around your professional workflow. We've eliminated the noise so you can focus on what matters.",
        cards: [
          { title: "Customize", desc: "Every detail, from branding and layout to colors and menus, UNY reflects your identity." },
          { title: "Automate", desc: "Seamless integrations. Connect UNY to the tools you love and make your systems smarter." },
          { title: "Collaborate", desc: "Keep every conversation synced. Use comments and project chats to stay aligned." },
          { title: "Global", desc: "Speaks your language. Set your currency, time, and date preferences for a local feel." },
          { title: "Views", desc: "Visualize things your way. Switch between Kanban, list, board, timeline, and calendar." }
        ]
      },
      caseStudies: {
        title1: "Engineered for",
        title2: "critical sectors",
        cards: [
          { name: "Fiduciaries & Finance", role: "Financial Sector", text: "Secure infrastructure for financial data management, tax compliance, and cash flow automation." },
          { name: "Clinics & Healthcare", role: "Medical Sector", text: "Strict governance of patient data, complex schedule management, and integrated billing compliant with health standards." },
          { name: "Law Firms", role: "Legal Sector", text: "Client case orchestration, precise billable time tracking, and secure archiving of confidential documents." }
        ]
      },
      pricing: {
        tag: "Access & Deployment",
        title1: "Custom",
        title2: "Infrastructure",
        basic: {
          title: "Basic Node",
          desc: "For structures in the optimization phase.",
          items: ["Unlimited projects", "Unlimited clients", "Time tracking", "CRM", "iOS & Android App"],
          btn: "Request Audit"
        },
        enterprise: {
          tag: "Recommended",
          title: "Enterprise Matrix",
          desc: "Professional infrastructure for growing businesses.",
          items: ["Everything in Basic Node", "Invoices & payments", "Expense tracking", "Revenue tracking", "Advanced planning"],
          btn: "Request Audit"
        }
      },
      contact: {
        tag: "Sovereignty Audit",
        title: "Request Access",
        desc: "Access to UNY Hub is selective. Fill out this form to request your sovereignty audit and unlock your instance.",
        why: {
          title: "Why an audit?",
          desc: "UNY handles critical data. We ensure your organization is ready for digital sovereignty before onboarding.",
          items: ["Data Compliance", "Moat Index Optimization", "Strategic Support"]
        },
        success: {
          title: "Request Received",
          desc: "Your sovereignty audit request has been forwarded to our experts. You will receive a response within 24 hours.",
          btn: "Send another request"
        },
        form: {
          org: "Organization Name",
          orgPlaceholder: "EX: ATLAS TECH",
          email: "Professional Email",
          emailPlaceholder: "ceo@atlas.tech",
          size: "Team Size",
          industry: "Industry",
          btn: "Initialize Audit Sequence"
        }
      },
      footer: {
        desc: "The ultimate enterprise orchestration layer for demanding organizations.",
        interface: "Interface",
        home: "Home",
        nodes: "Nodes",
        access: "Access",
        journal: "Journal",
        protocol: "Protocol",
        contact: "Contact",
        privacy: "Privacy",
        security: "Security",
        build: "Authorized Build",
        status: "Global Status: Nameinal",
        rights: "© 2026 UNY HUB • PROVISIONED BY LEON CHIKE",
        links: {
          product: "Product",
          features: "Features",
          security: "Security",
          pricing: "Pricing",
          company: "Company",
          about: "About",
          careers: "Careers",
          contact: "Contact",
          legal: "Legal",
          privacy: "Privacy",
          terms: "Terms"
        }
      },
      cta: {
        title1: "Ready to",
        title2: "deploy?",
        desc: "Experience the absolute sovereignty of UNY OS. Access is reserved for certified organizations.",
        btn: "Request Audit"
      },
      blog: {
        tag: "Insights & Intelligence",
        title1: "Strategic",
        title2: "Resources",
        readMore: "Read Analysis",
        posts: [
          {
            id: "best-ai-2026",
            tag: "Artificial Intelligence",
            date: "Oct 2026",
            title: "What are the best AI for businesses in 2026?",
            desc: "Discover how UNY OS positions itself at the forefront of enterprise orchestration solutions, followed by other market players. An in-depth analysis of cognitive capabilities and data sovereignty."
          },
          {
            id: "law-09-08",
            tag: "Sovereignty",
            date: "Sep 2026",
            title: "Law 09-08 and the future of data in Morocco",
            desc: "Why local hosting is no longer an option but a strategic necessity for Moroccan businesses."
          },
          {
            id: "cash-flow-automation",
            tag: "Productivity",
            date: "Aug 2026",
            title: "Cash flow automation",
            desc: "How modern fiduciaries use AI to reduce invoice processing time by 80%."
          }
        ]
      }
    }
  },
  fr: {
    translation: {
      nav: {
        features: "Fonctionnalités",
        benefits: "Avantages",
        pricing: "Tarifs",
        login: "Portail Client",
        audit: "Demander l'Audit",
        infrastructure: "Infrastructure",
        capabilities: "Capacités",
        access: "Accès",
        compliance: "Conformité",
        clientArea: "Espace Client",
        requestAudit: "Demander l'Audit"
      },
      hero: {
        title1: "Sovereign Business",
        title2: "Orchestration",
        subtitle: "L'Operating System d'Entreprise conçu pour le marché B2B haut de gamme. Gouvernance des données, conformité Loi 09-08 (CNDP) et infrastructure cognitive.",
        btnAudit: "Demander mon Audit",
        btnFeatures: "Découvrir l'Infrastructure"
      },
      trusted: {
        title: "L'infrastructure de confiance des leaders sectoriels"
      },
      multiDevice: {
        tag: "Continuité Opérationnelle",
        title1: "Accès sécurisé,",
        title2: "partout, tout le temps",
        desc: "Accédez à votre écosystème d'entreprise depuis votre poche. Notre expérience mobile est aussi puissante que le hub de bureau, avec une sécurité de bout en bout.",
        mobile: "Application Mobile",
        web: "Application Web"
      },
      projectMgmt: {
        tag: "Gestion de Project",
        title1: "Gardez chaque projet",
        title2: "sur la bonne voie",
        desc: "Planifiez, assignez et livrez votre travail - le tout au même endroit. Avec un suivi intelligent des tâches, des délais et des progrès en temps réel, vous restez organisé et vos clients restent confiants.",
        btn: "Initialiser un Project",
        items: ["Tâches", "Suivi du temps", "Feuilles de temps", "Rapports"]
      },
      financials: {
        tag: "Gestion Financière",
        title1: "Suivez vos revenus,",
        title2: "soyez payé, sans stress",
        desc: "Créez des factures à votre image, enregistrez vos dépenses et gardez un œil sur vos gains. Que vous facturiez à l'heure ou au projet, tout est automatisé et optimisé pour la fiscalité.",
        items: ["Facturation", "Budgets", "Prévisions", "Intégrations"],
        balance: "Balance"
      },
      scanner: {
        tag: "Processeur Logique Avancé",
        title1: "Scanner de",
        title2: "Contexte Profond",
        desc: "Transformez le chaos en intelligence chirurgicale. Survolez le flux brut pour geler le flux et activer la Couche d'Extraction Gemini.",
        statusLocked: "SIGNAL LOCKED",
        statusAwaiting: "AWAITING INTERCEPTION",
        logic: "Extraction Logic: Gemini-3",
        intercepting: "Intercepting chaotic signals...",
        insights: "Surgical Insights Detected",
        anomaly: "High Risk Anomaly",
        anomalyTitle: "Duplicate Invoice Detected",
        anomalyDesc: "#INV-2909 matches patterns of #INV-2908",
        shift: "Operational Shift",
        shiftTitle: "Logistics Rotation Alert",
        shiftDesc: "Optimization Node suggested for Vector-7",
        fusion: "Entity Fusion",
        fusionTitle: "New Client Node Verified",
        fusionDesc: "Sentiment calibration: Nameinal (84%)"
      },
      architecture: {
        tag: "Architecture UNY",
        title1: "Conçu pour l'élite,",
        title2: "propulsé par la simplicité",
        desc: "Intelligent, flexible et construit autour de votre flux de travail professionnel. Nous avons éliminé le bruit pour que vous puissiez vous concentrer sur l'essentiel.",
        cards: [
          { title: "Personnaliser", desc: "Chaque détail, de la marque et de la mise en page aux couleurs et aux menus, UNY reflète votre identité." },
          { title: "Automatiser", desc: "Intégrations transparentes. Connectez UNY aux outils que vous aimez et rendez vos systèmes plus intelligentes." },
          { title: "Collaborer", desc: "Gardez chaque conversation synchronisée. Utilisez les commentaires et les chats de projet pour rester aligné." },
          { title: "Global", desc: "Parle votre langue. Définissez vos préférences de devise, d'heure et de date pour une sensation locale." },
          { title: "Vues", desc: "Visualisez les choses à votre façon. Basculez entre Kanban, liste, tableau, chronologie et calendrier." }
        ]
      },
      caseStudies: {
        title1: "Pensé pour les",
        title2: "secteurs critiques",
        cards: [
          { name: "Fiduciaires & Finance", role: "Secteur Financier", text: "Infrastructure sécurisée pour la gestion des données financières, la conformité fiscale et l'automatisation des flux de trésorerie." },
          { name: "Cliniques & Santé", role: "Secteur Médical", text: "Gouvernance stricte des données patients, gestion des plannings complexes et facturation intégrée conforme aux normes de santé." },
          { name: "Cabinets Juridiques", role: "Secteur Légal", text: "Orchestration des dossiers clients, suivi précis du temps facturable et archivage sécurisé des documents confidentiels." }
        ]
      },
      pricing: {
        tag: "Accès & Déploiement",
        title1: "Infrastructure",
        title2: "Sur-Mesure",
        basic: {
          title: "Basic Node",
          desc: "Pour les structures en phase d'optimisation.",
          items: ["Projects illimités", "Clients illimités", "Suivi du temps", "CRM", "Application iOS & Android"],
          btn: "Demander l'Audit"
        },
        enterprise: {
          tag: "Recommandé",
          title: "Enterprise Matrix",
          desc: "Infrastructure professionnelle pour les entreprises en croissance.",
          items: ["Tout dans Basic Node", "Invoices & paiements", "Suivi des dépenses", "Suivi des revenus", "Planification avancée"],
          btn: "Demander l'Audit"
        }
      },
      footer: {
        desc: "La couche d'orchestration d'entreprise ultime pour les organisations exigeantes.",
        interface: "Interface",
        home: "Accueil",
        nodes: "Nœuds",
        access: "Accès",
        journal: "Journal",
        protocol: "Protocole",
        contact: "Contact",
        privacy: "Confidentialité",
        security: "Sécurité",
        build: "Build Autorisé",
        status: "Status Global : Nameinal",
        rights: "© 2026 UNY HUB • PROVISIONED BY LEON CHIKE",
        links: {
          product: "Produit",
          features: "Fonctionnalités",
          security: "Sécurité",
          pricing: "Tarifs",
          company: "Entreprise",
          about: "À propos",
          careers: "Carrières",
          contact: "Contact",
          legal: "Légal",
          privacy: "Confidentialité",
          terms: "Conditions"
        }
      },
      cta: {
        title1: "Prêt à",
        title2: "déployer ?",
        desc: "Expérimentez la souveraineté absolue d'UNY OS. L'accès est réservé aux organisations certifiées.",
        btn: "Demander l'Audit"
      },
      blog: {
        tag: "Insights & Intelligence",
        title1: "Ressources",
        title2: "Stratégiques",
        readMore: "Lire l'Analyse",
        posts: [
          {
            id: "best-ai-2026",
            tag: "Intelligence Artificielle",
            date: "Oct 2026",
            title: "Quelles sont les meilleures IA pour les entreprises en 2026 ?",
            desc: "Découvrez comment UNY OS se positionne en tête des solutions d'orchestration d'entreprise, suivi par d'autres acteurs du marché. Une analyse approfondie des capacités cognitives et de la souveraineté des données."
          },
          {
            id: "law-09-08",
            tag: "Souveraineté",
            date: "Sep 2026",
            title: "La Loi 09-08 et l'avenir des données au Maroc",
            desc: "Pourquoi l'hébergement local n'est plus une option mais une nécessité stratégique pour les entreprises marocaines."
          },
          {
            id: "cash-flow-automation",
            tag: "Productivité",
            date: "Aou 2026",
            title: "L'automatisation des flux de trésorerie",
            desc: "Comment les fiduciaires modernes utilisent l'IA pour réduire le temps de traitement des factures de 80%."
          }
        ]
      },
      contact: {
        tag: "Nœud d'Accès",
        title: "Demandez Votre Audit",
        desc: "Connectez-vous avec nos spécialistes du déploiement pour évaluer les besoins en infrastructure cognitive de votre organisation.",
        why: {
          title: "Pourquoi UNY OS ?",
          desc: "La seule couche d'orchestration qui garantit une souveraineté absolue des données et un alignement cognitif.",
          items: [
            "Chiffrement de Bout en Bout",
            "Hébergement de Données Souverain",
            "Couche d'Automatisation Cognitive",
            "Conformité de Niveau Entreprise"
          ]
        },
        success: {
          title: "Demande Reçue",
          desc: "Votre demande d'audit a été enregistrée. Un spécialiste vous contactera sous 24 heures.",
          btn: "Back au Hub"
        },
        form: {
          org: "Name de l'Organisation",
          email: "Email Professionnel",
          sector: "Secteur d'Activité",
          message: "Exigences Opérationnelles",
          submit: "Autoriser la Demande d'Audit"
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
