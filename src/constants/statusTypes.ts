// src/constants/statusTypes.ts
export const LEAD_STATUSES = {
  NEW: 'ליד חדש',
  CONTACTED: 'פנייה ראשונית בוצעה',
  INTERESTED: 'מעוניין',
  NOT_INTERESTED: 'לא מעוניין',
  MEETING_SCHEDULED: 'נקבעה פגישה/שיחה',
  DEMO_DONE: 'הדגמה בוצעה',
  PRICE_SENT: 'הצעת מחיר נשלחה',
  WAITING_RESPONSE: 'ממתין לתשובה',
  CONVERTED: 'הפך ללקוח',
  ARCHIVED: 'ארכיון', // אם החלטת להוסיף את זה כערך תקף
} as const;

export type LeadStatus = typeof LEAD_STATUSES[keyof typeof LEAD_STATUSES];

export const LEAD_SOURCE_TYPES = {
  WEBSITE: 'אתר',
  REFERRAL: 'הפניה',
  FACEBOOK: 'פייסבוק',
  INSTAGRAM: 'אינסטגרם',
  OTHER: 'אחר',
} as const;

export type LeadSource = typeof LEAD_SOURCE_TYPES[keyof typeof LEAD_SOURCE_TYPES];

export const CLIENT_STATUSES = {
  ACTIVE: 'פעיל',
  INACTIVE: 'לא פעיל',
  PENDING: 'בהמתנה',
  SUSPENDED: 'מושהה',
  ARCHIVED: 'ארכיון',
} as const;

export type ClientStatus = typeof CLIENT_STATUSES[keyof typeof CLIENT_STATUSES];

// מיפויים לתצוגה משופרת
export const LEAD_STATUS_DISPLAY: Record<LeadStatus, string> = {
  [LEAD_STATUSES.NEW]: 'ליד חדש',
  [LEAD_STATUSES.CONTACTED]: 'פנייה ראשונית בוצעה',
  [LEAD_STATUSES.INTERESTED]: 'מעוניין - שלחתי תמונות',
  [LEAD_STATUSES.NOT_INTERESTED]: 'לא מעוניין',
  [LEAD_STATUSES.MEETING_SCHEDULED]: 'נקבעה פגישה/שיחה',
  [LEAD_STATUSES.DEMO_DONE]: 'הדגמה בוצעה',
  [LEAD_STATUSES.PRICE_SENT]: 'הצעת מחיר נשלחה',
  [LEAD_STATUSES.WAITING_RESPONSE]: 'ממתין לתשובה',
  [LEAD_STATUSES.CONVERTED]: 'הפך ללקוח',
  [LEAD_STATUSES.ARCHIVED]: 'ארכיון',
};

// מיפוי צבעים לסטטוסים
export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  [LEAD_STATUSES.NEW]: 'blue-500',
  [LEAD_STATUSES.CONTACTED]: 'orange-500',
  [LEAD_STATUSES.INTERESTED]: 'green-400',
  [LEAD_STATUSES.NOT_INTERESTED]: 'red-500',
  [LEAD_STATUSES.MEETING_SCHEDULED]: 'purple-500',
  [LEAD_STATUSES.DEMO_DONE]: 'blue-700',
  [LEAD_STATUSES.PRICE_SENT]: 'pink-500',
  [LEAD_STATUSES.WAITING_RESPONSE]: 'yellow-500',
  [LEAD_STATUSES.CONVERTED]: 'green-700',
  [LEAD_STATUSES.ARCHIVED]: 'gray-400',
};

// Define SubmissionStatus based on your application's needs
// For example:
export const SUBMISSION_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  // Add other relevant statuses
} as const;

export type SubmissionStatus = typeof SUBMISSION_STATUSES[keyof typeof SUBMISSION_STATUSES]; 