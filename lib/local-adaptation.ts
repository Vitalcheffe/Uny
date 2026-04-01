/**
 * UNY OS V3.0 - Local Adaptation Module (Moroccan Core)
 * Handles currency formatting, fiscal calendars, and multi-language preparation.
 */

// 1. DIRHAM (MAD) FORMATTING
export const formatMAD = (amount: number, showDecimals: boolean = true): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

// 2. MOROCCAN FISCAL CALENDAR
export type FiscalEvent = {
  id: string;
  title: string;
  type: 'TVA' | 'IS' | 'IR' | 'CNSS';
  dueDate: Date;
  description: string;
  isUrgent: boolean;
};

export const getUpcomingFiscalDeadlines = (currentDate: Date = new Date()): FiscalEvent[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const deadlines: FiscalEvent[] = [];

  // Monthly TVA (Before the 20th of each month for the previous month)
  // Example: TVA for January is due Feb 20th.
  const nextTVADate = new Date(year, month, 20);
  if (currentDate.getDate() > 20) {
    nextTVADate.setMonth(month + 1);
  }
  
  deadlines.push({
    id: `tva-${nextTVADate.getTime()}`,
    title: 'Déclaration TVA Mensuelle',
    type: 'TVA',
    dueDate: nextTVADate,
    description: 'Télédéclaration et télépaiement de la TVA du mois précédent.',
    isUrgent: (nextTVADate.getTime() - currentDate.getTime()) < 7 * 24 * 60 * 60 * 1000 // Urgent if < 7 days
  });

  // Monthly CNSS (Before the 10th of each month)
  const nextCNSSDate = new Date(year, month, 10);
  if (currentDate.getDate() > 10) {
    nextCNSSDate.setMonth(month + 1);
  }

  deadlines.push({
    id: `cnss-${nextCNSSDate.getTime()}`,
    title: 'Déclaration CNSS',
    type: 'CNSS',
    dueDate: nextCNSSDate,
    description: 'Déclaration et paiement des cotisations CNSS.',
    isUrgent: (nextCNSSDate.getTime() - currentDate.getTime()) < 5 * 24 * 60 * 60 * 1000
  });

  // IS (Impôt sur les Sociétés) - Acomptes Provisionnels (Mar 31, Jun 30, Sep 30, Dec 31)
  const isAcomptes = [
    new Date(year, 2, 31), // March 31
    new Date(year, 5, 30), // June 30
    new Date(year, 8, 30), // September 30
    new Date(year, 11, 31) // December 31
  ];

  const nextIS = isAcomptes.find(d => d.getTime() >= currentDate.getTime()) || new Date(year + 1, 2, 31);
  
  deadlines.push({
    id: `is-${nextIS.getTime()}`,
    title: 'Acompte IS',
    type: 'IS',
    dueDate: nextIS,
    description: 'Paiement de l\'acompte provisionnel de l\'Impôt sur les Sociétés.',
    isUrgent: (nextIS.getTime() - currentDate.getTime()) < 14 * 24 * 60 * 60 * 1000
  });

  // Sort by closest due date
  return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};

// 3. MULTI-LANGUAGE PREPARATION (i18n skeleton)
export type SupportedLanguage = 'fr' | 'ar' | 'ary' | 'en'; // ary = Moroccan Arabic (Darija)

export const translations = {
  fr: {
    dashboard: 'Tableau de Bord',
    revenue: 'Chiffre d\'Affaires',
    clients: 'Clients',
    projects: 'Projects',
    invoices: 'Invoices',
    settings: 'Settings',
    ai_assistant: 'Assistant IA',
    core: 'Cœur de Système',
    intelligence: 'Intelligence & Savoir',
    operations: 'Opérations',
    human_capital: 'Capital Humain',
    management: 'Pilotage & Stratégie',
    sovereign_control: 'Contrôle Souverain',
    vault: 'Le Coffre (Docs)',
    knowledge_registry: 'Registre du Savoir',
    validation_center: 'Centre de Validation',
    invoicing: 'Facturation',
    contracts: 'Contracts',
    team: 'Team',
    time_tracking: 'Temps & Activité',
    treasury: 'Trésorerie',
    analytics: 'Analytique Hub',
    nav: {
      admin: {
        workflows: 'Automatisations',
        audit: 'Registre d\'Audit',
        billing: 'Facturation & Crédits',
        telemetry: 'Télémétrie System',
        gateway: 'Portail Admin'
      }
    },
    auth_errors: {
      'auth/user-not-found': 'Utilisateur introuvable.',
      'auth/wrong-password': 'Password incorrect.',
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/invalid-email': 'Email invalide.',
      'auth/weak-password': 'Le mot de passe est trop faible.',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
      'auth/network-request-failed': 'Erreur de connexion réseau.',
      'auth/popup-closed-by-user': 'La fenêtre de connexion a été fermée.',
      'auth/cancelled-popup-request': 'La demande de connexion a été annulée.',
    }
  },
  ar: {
    dashboard: 'لوحة القيادة',
    revenue: 'الإيرادات',
    clients: 'العملاء',
    projects: 'المشاريع',
    invoices: 'الفواتير',
    settings: 'الإعدادات',
    ai_assistant: 'المساعد الذكي',
    core: 'نواة النظام',
    intelligence: 'الذكاء والمعرفة',
    operations: 'العمليات',
    human_capital: 'رأس المال البشري',
    management: 'القيادة والاستراتيجية',
    sovereign_control: 'التحكم السيادي',
    vault: 'الخزنة (وثائق)',
    knowledge_registry: 'سجل المعرفة',
    validation_center: 'مركز التحقق',
    invoicing: 'الفواتير',
    contracts: 'العقود',
    team: 'الفريق',
    time_tracking: 'الوقت والنشاط',
    treasury: 'الخزينة',
    analytics: 'مركز التحليلات',
    nav: {
      admin: {
        workflows: 'الأتمتة',
        audit: 'سجل التدقيق',
        billing: 'الفواتير والائتمان',
        telemetry: 'نظام القياس',
        gateway: 'بوابة المسؤول'
      }
    },
    auth_errors: {
      'auth/user-not-found': 'المستخدم غير موجود.',
      'auth/wrong-password': 'كلمة المرور غير صحيحة.',
      'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل.',
      'auth/invalid-email': 'البريد الإلكتروني غير صالح.',
      'auth/weak-password': 'كلمة المرور ضعيفة جداً.',
      'auth/too-many-requests': 'محاولات كثيرة جداً. يرجى المحاولة لاحقاً.',
      'auth/network-request-failed': 'خطأ في اتصال الشبكة.',
      'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل الدخول.',
      'auth/cancelled-popup-request': 'تم إلغاء طلب تسجيل الدخول.',
    }
  },
  ary: { // Darija
    dashboard: 'الداشبورد',
    revenue: 'المدخول',
    clients: 'الكليان',
    projects: 'المشاريع',
    invoices: 'الفاتورات',
    settings: 'الريگلاج',
    ai_assistant: 'المساعد',
    core: 'القلب د السيستيم',
    intelligence: 'الذكاء والمعرفة',
    operations: 'الخدمة',
    human_capital: 'الناس',
    management: 'التسيير',
    sovereign_control: 'التحكم',
    vault: 'الخزنة',
    knowledge_registry: 'سجل المعرفة',
    validation_center: 'مركز التحقق',
    invoicing: 'الفاتورات',
    contracts: 'الكونطرات',
    team: 'الفريق',
    time_tracking: 'الوقت',
    treasury: 'الخزينة',
    analytics: 'التحليلات',
    nav: {
      admin: {
        workflows: 'الأتمتة',
        audit: 'سجل التدقيق',
        billing: 'الخلاص',
        telemetry: 'القياس',
        gateway: 'البوابة'
      }
    },
    auth_errors: {
      'auth/user-not-found': 'المستخدم ماكاينش.',
      'auth/wrong-password': 'كلمة السر غالطة.',
      'auth/email-already-in-use': 'هاد الإيميل ديجا مستعمل.',
      'auth/invalid-email': 'إيميل ماشي صحيح.',
      'auth/weak-password': 'كلمة السر ضعيفة بزاف.',
      'auth/too-many-requests': 'بزاف د المحاولات. عاود من بعد.',
      'auth/network-request-failed': 'مشكل ف الكونيكسيون.',
      'auth/popup-closed-by-user': 'تسات النافذة د الدخول.',
      'auth/cancelled-popup-request': 'تلاغى الطلب د الدخول.',
    }
  },
  en: {
    dashboard: 'Dashboard',
    revenue: 'Revenue',
    clients: 'Clients',
    projects: 'Projects',
    invoices: 'Invoices',
    settings: 'Settings',
    ai_assistant: 'AI Assistant',
    core: 'System Core',
    intelligence: 'Intelligence & Knowledge',
    operations: 'Operations',
    human_capital: 'Human Capital',
    management: 'Strategy & Steering',
    sovereign_control: 'Sovereign Control',
    vault: 'The Vault (Docs)',
    knowledge_registry: 'Knowledge Registry',
    validation_center: 'Validation Center',
    invoicing: 'Invoicing',
    contracts: 'Contracts',
    team: 'Team',
    time_tracking: 'Time & Activity',
    treasury: 'Treasury',
    analytics: 'Analytics Hub',
    nav: {
      admin: {
        workflows: 'Automations',
        audit: 'Audit Ledger',
        billing: 'Billing & Credits',
        telemetry: 'System Telemetry',
        gateway: 'Admin Gateway'
      }
    },
    auth_errors: {
      'auth/user-not-found': 'User not found.',
      'auth/wrong-password': 'Wrong password.',
      'auth/email-already-in-use': 'Email already in use.',
      'auth/invalid-email': 'Invalid email.',
      'auth/weak-password': 'Password is too weak.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network connection error.',
      'auth/popup-closed-by-user': 'The login window was closed.',
      'auth/cancelled-popup-request': 'The login request was cancelled.',
    }
  }
};

export const getTranslation = (lang: SupportedLanguage, key: string): string => {
  const keys = key.split('.');
  let result: any = translations[lang];
  
  for (const k of keys) {
    if (result && result[k]) {
      result = result[k];
    } else {
      // Fallback to English
      let fallback: any = translations['en'];
      for (const fk of keys) {
        if (fallback && fallback[fk]) {
          fallback = fallback[fk];
        } else {
          return key; // Return key if not found
        }
      }
      return fallback;
    }
  }
  
  return typeof result === 'string' ? result : key;
};
