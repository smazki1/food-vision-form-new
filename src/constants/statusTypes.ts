
export type LeadStatus = 
  | "ליד חדש"
  | "פנייה ראשונית בוצעה"
  | "מעוניין"
  | "לא מעוניין"
  | "נקבעה פגישה/שיחה"
  | "הדגמה בוצעה"
  | "הצעת מחיר נשלחה"
  | "ממתין לתשובה"
  | "הפך ללקוח";

export type LeadSource = 
  | "אתר"
  | "פייסבוק"
  | "גוגל"
  | "המלצה"
  | "אחר";

export type ClientStatus = 
  | "פעיל"
  | "לא פעיל"
  | "בהמתנה";

export type SubmissionStatus = 
  | "ממתינה לעיבוד"
  | "בעיבוד"
  | "מוכנה להצגה"
  | "הערות התקבלו"
  | "הושלמה ואושרה";

// Constants objects
export const LEAD_STATUSES = {
  NEW: "ליד חדש" as LeadStatus,
  INITIAL_CONTACT: "פנייה ראשונית בוצעה" as LeadStatus,
  INTERESTED: "מעוניין" as LeadStatus,
  NOT_INTERESTED: "לא מעוניין" as LeadStatus,
  MEETING_SCHEDULED: "נקבעה פגישה/שיחה" as LeadStatus,
  DEMO_COMPLETED: "הדגמה בוצעה" as LeadStatus,
  QUOTE_SENT: "הצעת מחיר נשלחה" as LeadStatus,
  AWAITING_RESPONSE: "ממתין לתשובה" as LeadStatus,
  CONVERTED_TO_CLIENT: "הפך ללקוח" as LeadStatus,
  ARCHIVED: "ארכיון" as LeadStatus
};

export const LEAD_SOURCE_TYPES = {
  WEBSITE: "אתר" as LeadSource,
  FACEBOOK: "פייסבוק" as LeadSource,
  GOOGLE: "גוגל" as LeadSource,
  REFERRAL: "המלצה" as LeadSource,
  OTHER: "אחר" as LeadSource
};

export const CLIENT_STATUSES = {
  ACTIVE: "פעיל" as ClientStatus,
  INACTIVE: "לא פעיל" as ClientStatus,
  PENDING: "בהמתנה" as ClientStatus
};

export const LEAD_STATUS_DISPLAY: Record<LeadStatus, string> = {
  "ליד חדש": "ליד חדש",
  "פנייה ראשונית בוצעה": "פנייה ראשונית בוצעה",
  "מעוניין": "מעוניין",
  "לא מעוניין": "לא מעוניין",
  "נקבעה פגישה/שיחה": "נקבעה פגישה/שיחה",
  "הדגמה בוצעה": "הדגמה בוצעה",
  "הצעת מחיר נשלחה": "הצעת מחיר נשלחה",
  "ממתין לתשובה": "ממתין לתשובה",
  "הפך ללקוח": "הפך ללקוח"
};
