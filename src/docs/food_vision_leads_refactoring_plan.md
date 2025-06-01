# תוכנית רפקטורינג מפורטת למערכת ניהול הלידים

מעולה שהתיקונים המיידיים פתרו את הבעיות! כעת אציג תוכנית רפקטורינג הדרגתית שתשפר את הארכיטקטורה של המערכת לטווח הארוך, מחולקת לשלבים מדורגים.

## שלב 1: סטנדרטיזציה של הגדרות ומבני נתונים

### 1.1 יצירת מודל נתונים מרכזי

```tsx
// src/types/models.ts
export interface Lead {
  lead_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string; // סטנדרטיזציה של שם השדה
  email: string;
  lead_status: LeadStatus;
  lead_source: LeadSource | null;
  created_at: string;
  updated_at: string;
  next_follow_up_date?: string;
  next_follow_up_notes?: string;
  notes?: string;
  ai_trainings_count: number;
  ai_training_cost_per_unit: number;
  ai_prompts_count: number;
  ai_prompt_cost_per_unit: number;
  total_ai_costs?: number; // שדה מחושב
  revenue_from_lead_local?: number;
  exchange_rate_at_conversion?: number;
  revenue_from_lead_usd?: number; // שדה מחושב
  roi?: number; // שדה מחושב
  client_id?: string; // קישור ללקוח אם הומר
  free_sample_package_active: boolean;
}

export interface Client {
  client_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  client_status: ClientStatus;
  original_lead_id?: string; // קישור לליד המקורי
  user_auth_id?: string;
  current_package_id?: string;
  remaining_servings: number;
  created_at: string;
  last_activity_at: string;
  // שאר השדות הרלוונטיים
}

export interface Submission {
  submission_id: string;
  restaurant_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  item_type: 'dish' | 'cocktail' | 'drink';
  item_name: string;
  description?: string;
  special_notes?: string;
  image_urls: string[];
  status: SubmissionStatus;
  created_at: string;
  created_lead_id?: string; // קישור לליד שנוצר אם יש
}

// וכן הלאה עבור מודלים נוספים

```

### 1.2 יצירת קובץ קבועים לסטטוסים וערכי Enum

```tsx
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

```

### 1.3 סנכרון הדאטאבייס (רק אם חסרים ערכים בdatabase שרוצים להוסיף)

```sql
-- במידה ורוצים להוסיף את הערך "ארכיון" ל-enum
-- src/migrations/add_archive_status.sql
ALTER TYPE lead_status_type ADD VALUE 'ארכיון' AFTER 'הפך ללקוח';

-- או, אם יש צורך לסנכרן את כל הערכים (זה דורש יצירת enum חדש)
-- CREATE TYPE lead_status_type_new AS ENUM ('ליד חדש', 'פנייה ראשונית בוצעה', 'מעוניין', 'לא מעוניין', 'נקבעה פגישה/שיחה', 'הדגמה בוצעה', 'הצעת מחיר נשלחה', 'ממתין לתשובה', 'הפך ללקוח', 'ארכיון');
-- ALTER TABLE leads ALTER COLUMN lead_status TYPE lead_status_type_new USING lead_status::text::lead_status_type_new;
-- DROP TYPE lead_status_type;
-- ALTER TYPE lead_status_type_new RENAME TO lead_status_type;

```

## שלב 2: שכבת API מופשטת (שבוע 2)

### 2.1 שכבת API ללידים

```tsx
// src/api/leadsAPI.ts
import { supabase } from '@/integrations/supabase';
import { Lead, LeadStatus } from '@/types/models';
import { LEAD_STATUSES } from '@/constants/statusTypes';

export const leadsAPI = {
  async fetchLeads(options: {
    statuses?: LeadStatus[];
    searchTerm?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  } = {}): Promise<Lead[]> {
    try {
      const {
        statuses,
        searchTerm,
        sortBy = 'created_at',
        sortDirection = 'desc',
        page = 0,
        pageSize = 20
      } = options;

      let query = supabase
        .from('leads')
        .select('*');

      // החלת פילטרים
      if (statuses && statuses.length > 0) {
        query = query.in('lead_status', statuses);
      } else {
        // כברירת מחדל, הצג את כל הלידים הפעילים (לא בארכיון)
        const activeStatuses = Object.values(LEAD_STATUSES).filter(
          status => status !== LEAD_STATUSES.ARCHIVED
        );
        query = query.in('lead_status', activeStatuses);
      }

      if (searchTerm) {
        query = query.or(
          `restaurant_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        );
      }

      // סידור וחלוקה לעמודים
      query = query
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error } = await query;

      if (error) throw new Error(`Error fetching leads: ${error.message}`);
      return data as Lead[];
    } catch (error) {
      console.error('Error in fetchLeads:', error);
      throw error;
    }
  },

  async fetchLeadById(leadId: string): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) throw new Error(`Error fetching lead: ${error.message}`);
      return data as Lead;
    } catch (error) {
      console.error(`Error fetching lead ${leadId}:`, error);
      throw error;
    }
  },

  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          lead_status: leadData.lead_status || LEAD_STATUSES.NEW,
          created_at: now,
          updated_at: now,
          ai_trainings_count: leadData.ai_trainings_count || 0,
          ai_training_cost_per_unit: leadData.ai_training_cost_per_unit || 1.5,
          ai_prompts_count: leadData.ai_prompts_count || 0,
          ai_prompt_cost_per_unit: leadData.ai_prompt_cost_per_unit || 0.16,
          free_sample_package_active: leadData.free_sample_package_active || false
        })
        .select()
        .single();

      if (error) throw new Error(`Error creating lead: ${error.message}`);

      // הוספת רשומת פעילות
      await this.addLeadActivity(data.lead_id, 'ליד חדש נוצר');

      return data as Lead;
    } catch (error) {
      console.error('Error in createLead:', error);
      throw error;
    }
  },

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId)
        .select()
        .single();

      if (error) throw new Error(`Error updating lead: ${error.message}`);

      // הוספת רשומת פעילות אם יש שינוי סטטוס
      if (updates.lead_status) {
        await this.addLeadActivity(
          leadId,
          `סטטוס עודכן ל: ${LEAD_STATUS_DISPLAY[updates.lead_status as LeadStatus] || updates.lead_status}`
        );
      }

      return data as Lead;
    } catch (error) {
      console.error(`Error updating lead ${leadId}:`, error);
      throw error;
    }
  },

  async addLeadActivity(leadId: string, description: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: leadId,
          activity_description: description,
          activity_timestamp: new Date().toISOString()
        });

      if (error) throw new Error(`Error adding lead activity: ${error.message}`);
    } catch (error) {
      console.error(`Error adding activity for lead ${leadId}:`, error);
      // לא לזרוק שגיאה כאן - פעולות לוג לא צריכות לעצור את זרימת העבודה
    }
  },

  async convertToClient(leadId: string): Promise<{ clientId: string, success: boolean }> {
    try {
      const { data, error } = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: leadId
      });

      if (error) throw new Error(`Error converting lead to client: ${error.message}`);

      return { clientId: data, success: true };
    } catch (error) {
      console.error(`Error converting lead ${leadId} to client:`, error);
      return { clientId: '', success: false };
    }
  },

  async archiveLead(leadId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          lead_status: LEAD_STATUSES.ARCHIVED,
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId);

      if (error) throw new Error(`Error archiving lead: ${error.message}`);

      await this.addLeadActivity(leadId, 'ליד הועבר לארכיון');

      return true;
    } catch (error) {
      console.error(`Error archiving lead ${leadId}:`, error);
      return false;
    }
  },

  async restoreFromArchive(leadId: string, newStatus: LeadStatus = LEAD_STATUSES.NEW): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          lead_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId)
        .eq('lead_status', LEAD_STATUSES.ARCHIVED);

      if (error) throw new Error(`Error restoring lead from archive: ${error.message}`);

      await this.addLeadActivity(
        leadId,
        `ליד שוחזר מהארכיון עם סטטוס: ${LEAD_STATUS_DISPLAY[newStatus]}`
      );

      return true;
    } catch (error) {
      console.error(`Error restoring lead ${leadId} from archive:`, error);
      return false;
    }
  }
};

```

### 2.2 שכבת API להגשות

```tsx
// src/api/submissionsAPI.ts
import { supabase } from '@/integrations/supabase';
import { Submission } from '@/types/models';

export const submissionsAPI = {
  async submitPublicForm(formData: {
    restaurantName: string;
    contactName: string;
    phone: string;
    email: string;
    itemType: 'dish' | 'cocktail' | 'drink';
    itemName: string;
    description: string;
    specialNotes?: string;
    category?: string;
    images: File[];
  }) {
    try {
      // 1. העלאת התמונות
      const imageUrls = await Promise.all(
        formData.images.map(async (file) => {
          const fileName = `public-submissions/${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
          const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file);

          if (error) throw error;

          return supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl;
        })
      );

      // 2. שמירת הנתונים
      const { data, error } = await supabase.rpc('public_submit_item_by_restaurant_name', {
        p_restaurant_name: formData.restaurantName,
        p_contact_name: formData.contactName,
        p_phone: formData.phone,  // עכשיו משתמשים בשם השדה הנכון
        p_email: formData.email,
        p_item_type: formData.itemType,
        p_item_name: formData.itemName,
        p_description: formData.description,
        p_special_notes: formData.specialNotes || '',
        p_category: formData.category || '',
        p_image_urls: JSON.stringify(imageUrls)
      });

      if (error) throw error;

      return { success: true, submissionId: data };
    } catch (error) {
      console.error('Error in form submission:', error);
      return { success: false, error: error.message };
    }
  },

  // פונקציות נוספות לניהול הגשות - שליפה, עדכון וכו'
};

```

### 2.3 שכבת API ללקוחות

```tsx
// src/api/clientsAPI.ts
import { supabase } from '@/integrations/supabase';
import { Client } from '@/types/models';
import { CLIENT_STATUSES } from '@/constants/statusTypes';

export const clientsAPI = {
  async fetchClients(options: {
    statuses?: string[];
    searchTerm?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<Client[]> {
    // יישום דומה ל-fetchLeads
    // ...
  },

  async fetchClientById(clientId: string): Promise<Client> {
    // יישום דומה ל-fetchLeadById
    // ...
  },

  // פונקציות נוספות לניהול לקוחות
};

```

## שלב 3: קומפוננטות UI משופרות (שבוע 3)

### 3.1 קומפוננטות גנריות לסטטוס ותוויות

```tsx
// src/components/common/StatusBadge.tsx
import React from 'react';
import { LEAD_STATUS_COLORS, LEAD_STATUS_DISPLAY } from '@/constants/statusTypes';
import { LeadStatus } from '@/types/models';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`px-2 py-1 rounded-full text-white text-xs font-medium bg-${LEAD_STATUS_COLORS[status]} ${className}`}
    >
      {LEAD_STATUS_DISPLAY[status] || status}
    </span>
  );
};

```

### 3.2 טופס לידים משופר

```tsx
// src/components/admin/leads/LeadForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lead } from '@/types/models';
import { LEAD_STATUSES, LEAD_SOURCE_TYPES } from '@/constants/statusTypes';

// סכמת ולידציה
const leadFormSchema = z.object({
  restaurant_name: z.string().min(1, 'שם המסעדה הוא שדה חובה'),
  contact_name: z.string().min(1, 'שם איש הקשר הוא שדה חובה'),
  phone: z.string().min(1, 'מספר טלפון הוא שדה חובה'),
  email: z.string().email('אנא הזן כתובת אימייל תקינה'),
  lead_status: z.string(),
  lead_source: z.string().nullable(),
  next_follow_up_date: z.string().nullable().optional(),
  next_follow_up_notes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // השדות הנוספים...
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  initialData?: Partial<Lead>;
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: initialData || {
      lead_status: LEAD_STATUSES.NEW,
      lead_source: null
    }
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmitForm = (data: LeadFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">שם מסעדה</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('restaurant_name')}
          />
          {errors.restaurant_name && (
            <p className="mt-1 text-sm text-red-600">{errors.restaurant_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">איש קשר</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('contact_name')}
          />
          {errors.contact_name && (
            <p className="mt-1 text-sm text-red-600">{errors.contact_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">טלפון</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">אימייל</label>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">סטטוס</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('lead_status')}
          >
            {Object.values(LEAD_STATUSES).map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_DISPLAY[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">מקור</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('lead_source')}
          >
            <option value="">בחר מקור</option>
            {Object.values(LEAD_SOURCE_TYPES).map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">תאריך מעקב הבא</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('next_follow_up_date')}
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">הערות למעקב הבא</label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={2}
            {...register('next_follow_up_notes')}
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">הערות כלליות</label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={3}
            {...register('notes')}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={isLoading}
        >
          ביטול
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading}
        >
          {isLoading ? 'שומר...' : initialData ? 'עדכן ליד' : 'צור ליד'}
        </button>
      </div>
    </form>
  );
};

```

## שלב 4: React Query Hooks משופרים (שבוע 4)

### 4.1 hooks ללידים

```tsx
// src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '@/api/leadsAPI';
import { Lead, LeadStatus } from '@/types/models';
import { toast } from 'react-hot-toast'; // או כל ספריית toast אחרת

export const useLeads = (options = {}) => {
  return useQuery({
    queryKey: ['leads', options],
    queryFn: () => leadsAPI.fetchLeads(options),
  });
};

export const useLeadDetails = (leadId: string | null) => {
  return useQuery({
    queryKey: ['leadDetails', leadId],
    queryFn: () => leadsAPI.fetchLeadById(leadId!),
    enabled: !!leadId, // רק אם יש leadId
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadData: Partial<Lead>) => leadsAPI.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('ליד חדש נוצר בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      toast.error(`שגיאה ביצירת ליד: ${error.message}`);
    }
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadI

```

## שלב 4: React Query Hooks משופרים (המשך)

```tsx
// src/hooks/useLeads.ts (המשך)
export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) =>
      leadsAPI.updateLead(leadId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails', variables.leadId] });
      toast.success('הליד עודכן בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error updating lead:', error);
      toast.error(`שגיאה בעדכון הליד: ${error.message}`);
    }
  });
};

export const useConvertLeadToClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => leadsAPI.convertToClient(leadId),
    onSuccess: (result, leadId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', leadId] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        toast.success('הליד הומר ללקוח בהצלחה');
      } else {
        toast.error('לא ניתן להמיר את הליד ללקוח');
      }
    },
    onError: (error: any) => {
      console.error('Error converting lead to client:', error);
      toast.error(`שגיאה בהמרת הליד ללקוח: ${error.message}`);
    }
  });
};

export const useArchiveLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => leadsAPI.archiveLead(leadId),
    onSuccess: (success, leadId) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', leadId] });
        toast.success('הליד הועבר לארכיון בהצלחה');
      } else {
        toast.error('לא ניתן להעביר את הליד לארכיון');
      }
    },
    onError: (error: any) => {
      console.error('Error archiving lead:', error);
      toast.error(`שגיאה בהעברת הליד לארכיון: ${error.message}`);
    }
  });
};

export const useRestoreLeadFromArchive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: string; newStatus?: LeadStatus }) =>
      leadsAPI.restoreFromArchive(leadId, newStatus),
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', variables.leadId] });
        toast.success('הליד שוחזר מהארכיון בהצלחה');
      } else {
        toast.error('לא ניתן לשחזר את הליד מהארכיון');
      }
    },
    onError: (error: any) => {
      console.error('Error restoring lead from archive:', error);
      toast.error(`שגיאה בשחזור הליד מהארכיון: ${error.message}`);
    }
  });
};

```

### 4.2 hooks להגשות

```tsx
// src/hooks/useSubmissions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsAPI } from '@/api/submissionsAPI';
import { toast } from 'react-hot-toast';

export const useSubmitPublicForm = () => {
  return useMutation({
    mutationFn: (formData: any) => submissionsAPI.submitPublicForm(formData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('ההגשה בוצעה בהצלחה');
        return result.submissionId;
      } else {
        toast.error(`שגיאה בהגשה: ${result.error || 'אירעה שגיאה'}`);
        throw new Error(result.error || 'אירעה שגיאה בהגשה');
      }
    },
    onError: (error: any) => {
      console.error('Error submitting form:', error);
      toast.error(`שגיאה בהגשה: ${error.message}`);
    }
  });
};

// פונקציות נוספות להגשות...

```

## שלב 5: שדרוג דף ניהול הלידים (שבוע 5)

### 5.1 דף ניהול הלידים המעודכן

```tsx
// src/pages/admin/leads/AdminLeadsPage.tsx
import React, { useState } from 'react';
import { Lead, LeadStatus } from '@/types/models';
import { useLeads, useCreateLead, useUpdateLead, useArchiveLead, useConvertLeadToClient } from '@/hooks/useLeads';
import { LEAD_STATUSES } from '@/constants/statusTypes';

// Import our components
import { LeadsHeader } from '@/components/admin/leads/LeadsHeader';
import { LeadsFilters } from '@/components/admin/leads/LeadsFilters';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { LeadFormModal } from '@/components/admin/leads/LeadFormModal';
import { LeadDetailsPanel } from '@/components/admin/leads/LeadDetailsPanel';

const AdminLeadsPage: React.FC = () => {
  // פילטרים
  const [filters, setFilters] = useState({
    searchTerm: '',
    statuses: undefined as LeadStatus[] | undefined,
    sortBy: 'created_at',
    sortDirection: 'desc' as 'asc' | 'desc',
  });

  // מודאלים ופאנלים
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // להשתמש ב-React Query Hooks
  const { data: leads = [], isLoading, error } = useLeads(filters);
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const archiveLeadMutation = useArchiveLead();
  const convertToClientMutation = useConvertLeadToClient();

  // פעולות
  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsFormModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsFormModalOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsPanelOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Lead>) => {
    try {
      if (selectedLead) {
        await updateLeadMutation.mutateAsync({
          leadId: selectedLead.lead_id,
          updates: data
        });
      } else {
        await createLeadMutation.mutateAsync(data);
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleArchiveLead = async (leadId: string) => {
    try {
      await archiveLeadMutation.mutateAsync(leadId);
    } catch (error) {
      console.error('Error archiving lead:', error);
    }
  };

  const handleConvertToClient = async (leadId: string) => {
    try {
      await convertToClientMutation.mutateAsync(leadId);
    } catch (error) {
      console.error('Error converting lead to client:', error);
    }
  };

  const applyFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      statuses: undefined,
      sortBy: 'created_at',
      sortDirection: 'desc',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <LeadsHeader onCreateLead={handleCreateLead} />

      <LeadsFilters
        filters={filters}
        onFilterChange={applyFilters}
        onClearFilters={clearFilters}
      />

      <LeadsTable
        leads={leads}
        isLoading={isLoading}
        error={error}
        onView={handleViewLead}
        onEdit={handleEditLead}
        onArchive={handleArchiveLead}
        onConvertToClient={handleConvertToClient}
        sortBy={filters.sortBy}
        sortDirection={filters.sortDirection}
        onSort={(field) => {
          if (field === filters.sortBy) {
            applyFilters({
              sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
            });
          } else {
            applyFilters({ sortBy: field, sortDirection: 'desc' });
          }
        }}
      />

      {/* מודאל יצירה/עריכת ליד */}
      <LeadFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={selectedLead || undefined}
        onSubmit={handleFormSubmit}
        isLoading={createLeadMutation.isPending || updateLeadMutation.isPending}
      />

      {/* פאנל פרטי ליד */}
      <LeadDetailsPanel
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        leadId={selectedLead?.lead_id}
        onEdit={() => {
          setIsDetailsPanelOpen(false);
          setIsFormModalOpen(true);
        }}
        onArchive={handleArchiveLead}
        onConvertToClient={handleConvertToClient}
      />
    </div>
  );
};

export default AdminLeadsPage;

```

### 5.2 רכיב פילטרים משופר

```tsx
// src/components/admin/leads/LeadsFilters.tsx
import React from 'react';
import { LeadStatus } from '@/types/models';
import { LEAD_STATUSES, LEAD_STATUS_DISPLAY, LEAD_SOURCE_TYPES } from '@/constants/statusTypes';

interface LeadsFiltersProps {
  filters: {
    searchTerm: string;
    statuses?: LeadStatus[];
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
  onFilterChange: (filters: Partial<LeadsFiltersProps['filters']>) => void;
  onClearFilters: () => void;
}

export const LeadsFilters: React.FC<LeadsFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ searchTerm: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let newStatuses: LeadStatus[] | undefined;

    if (value === 'all') {
      newStatuses = undefined;
    } else if (value === 'active') {
      // כל הסטטוסים הפעילים (לא ארכיון)
      newStatuses = Object.values(LEAD_STATUSES).filter(
        status => status !== LEAD_STATUSES.ARCHIVED
      ) as LeadStatus[];
    } else {
      newStatuses = [value as LeadStatus];
    }

    onFilterChange({ statuses: newStatuses });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">חיפוש</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="חיפוש לפי שם מסעדה, איש קשר או אימייל"
              type="search"
              value={filters.searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="w-full md:w-auto">
          <label htmlFor="status" className="sr-only">סטטוס</label>
          <select
            id="status"
            name="status"
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={filters.statuses?.length === 1 ? filters.statuses[0] : (filters.statuses ? 'active' : 'all')}
            onChange={handleStatusChange}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="active">לידים פעילים</option>
            {Object.values(LEAD_STATUSES).map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_DISPLAY[status]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          נקה פילטרים
        </button>
      </div>

      {/* אפשר להוסיף פה עוד פילטרים מתקדמים (כמו תאריך יצירה, ROI וכדומה) */}
    </div>
  );
};

```

### 5.3 רכיב טבלת לידים משופר

```tsx
// src/components/admin/leads/LeadsTable.tsx
import React from 'react';
import { Lead } from '@/types/models';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  error: Error | null;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onArchive: (leadId: string) => void;
  onConvertToClient: (leadId: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  isLoading,
  error,
  onView,
  onEdit,
  onArchive,
  onConvertToClient,
  sortBy,
  sortDirection,
  onSort
}) => {
  if (isLoading) {
    return <div className="text-center py-4">טוען נתונים...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium text-red-800">שגיאה בטעינת הנתונים</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">לא נמצאו לידים מתאימים לחיפוש.</p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;

    return (
      <span className="mr-1">
        {sortDirection === 'asc' ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('restaurant_name')}
            >
              <div className="flex items-center">
                שם מסעדה
                <SortIcon field="restaurant_name" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('contact_name')}
            >
              <div className="flex items-center">
                איש קשר
                <SortIcon field="contact_name" />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              טלפון
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              סטטוס
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('next_follow_up_date')}
            >
              <div className="flex items-center">
                מעקב הבא
                <SortIcon field="next_follow_up_date" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('total_ai_costs')}
            >
              <div className="flex items-center">
                עלויות AI
                <SortIcon field="total_ai_costs" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('roi')}
            >
              <div className="flex items-center">
                ROI
                <SortIcon field="roi" />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              פעולות
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.lead_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => onView(lead)}>
                  {lead.restaurant_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{lead.contact_name}</div>
                <div className="text-sm text-gray-500">{lead.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {lead.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={lead.lead_status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {lead.next_follow_up_date ? formatDate(lead.next_follow_up_date) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(lead.total_ai_costs || 0, 'USD')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {lead.roi !== null && lead.roi !== undefined ? (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${lead.roi >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {lead.roi.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onView(lead)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="צפייה"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit(lead)}
                    className="text-blue-600 hover:text-blue-900"
                    title="עריכה"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onArchive(lead.lead_id)}
                    className="text-gray-600 hover:text-gray-900"
                    title="העבר לארכיון"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {lead.lead_status !== 'הפך ללקוח' && (
                    <button
                      onClick={() => onConvertToClient(lead.lead_id)}
                      className="text-green-600 hover:text-green-900"
                      title="המר ללקוח"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

```

## שלב 6: בדיקות ותיעוד (שבוע 6)

### 6.1 בדיקות

```tsx
// src/__tests__/api/leadsAPI.test.ts
import { leadsAPI } from '@/api/leadsAPI';
import { LEAD_STATUSES } from '@/constants/statusTypes';

// מוק לסופאבייס
jest.mock('@/integrations/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
  }
}));

describe('leadsAPI', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetchLeads should apply correct filters', async () => {
    // Setup
    const mockData = [{ lead_id: '123', restaurant_name: 'Test Restaurant' }];
    const mockSuapabase = require('@/integrations/supabase').supabase;
    mockSuapabase.select.mockReturnThis();
    mockSuapabase.order.mockResolvedValue({ data: mockData, error: null });

    // Execute
    await leadsAPI.fetchLeads({
      statuses: [LEAD_STATUSES.NEW, LEAD_STATUSES.INTERESTED],
      searchTerm: 'test',
    });

```

## שלב 6: בדיקות ותיעוד (המשך)

```tsx
// src/__tests__/api/leadsAPI.test.ts (המשך)
    // Verify
    expect(mockSuapabase.from).toHaveBeenCalledWith('leads');
    expect(mockSuapabase.select).toHaveBeenCalled();
    expect(mockSuapabase.in).toHaveBeenCalledWith('lead_status', [LEAD_STATUSES.NEW, LEAD_STATUSES.INTERESTED]);
    expect(mockSuapabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  test('createLead should insert new lead with correct defaults', async () => {
    // Setup
    const mockLead = {
      restaurant_name: 'New Restaurant',
      contact_name: 'Test Contact',
      phone: '123456789',
      email: 'test@example.com',
    };

    const mockSuapabase = require('@/integrations/supabase').supabase;
    mockSuapabase.insert.mockReturnThis();
    mockSuapabase.select.mockReturnThis();
    mockSuapabase.single.mockResolvedValue({
      data: { lead_id: '123', ...mockLead, lead_status: LEAD_STATUSES.NEW },
      error: null,
    });

    // Execute
    const result = await leadsAPI.createLead(mockLead);

    // Verify
    expect(mockSuapabase.from).toHaveBeenCalledWith('leads');
    expect(mockSuapabase.insert).toHaveBeenCalled();
    expect(mockSuapabase.insert.mock.calls[0][0]).toMatchObject({
      ...mockLead,
      lead_status: LEAD_STATUSES.NEW,
      ai_trainings_count: 0,
      ai_prompts_count: 0,
    });
    expect(result).toEqual(expect.objectContaining({
      lead_id: '123',
      restaurant_name: 'New Restaurant',
    }));
  });

  // בדיקות נוספות...
});

// src/__tests__/hooks/useLeads.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads, useCreateLead, useUpdateLead } from '@/hooks/useLeads';
import { leadsAPI } from '@/api/leadsAPI';

// מוק ל-API
jest.mock('@/api/leadsAPI', () => ({
  leadsAPI: {
    fetchLeads: jest.fn(),
    createLead: jest.fn(),
    updateLead: jest.fn(),
    // ... יתר הפונקציות
  },
}));

// מוק ל-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('useLeads hooks', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  });

  test('useLeads should fetch leads with correct options', async () => {
    // Setup
    const mockLeads = [{ lead_id: '123', restaurant_name: 'Test' }];
    (leadsAPI.fetchLeads as jest.Mock).mockResolvedValue(mockLeads);

    // Execute
    const { result, waitFor } = renderHook(
      () => useLeads({ searchTerm: 'test' }),
      { wrapper }
    );

    // Verify
    await waitFor(() => !result.current.isLoading);
    expect(leadsAPI.fetchLeads).toHaveBeenCalledWith({ searchTerm: 'test' });
    expect(result.current.data).toEqual(mockLeads);
  });

  test('useCreateLead should create lead and invalidate queries', async () => {
    // Setup
    const mockLead = {
      restaurant_name: 'New Restaurant',
      contact_name: 'Contact',
      phone: '123456789',
      email: 'test@example.com',
    };
    const mockCreatedLead = { lead_id: '123', ...mockLead };
    (leadsAPI.createLead as jest.Mock).mockResolvedValue(mockCreatedLead);

    // Execute
    const { result, waitFor } = renderHook(() => useCreateLead(), { wrapper });

    act(() => {
      result.current.mutate(mockLead);
    });

    // Verify
    await waitFor(() => !result.current.isPending);
    expect(leadsAPI.createLead).toHaveBeenCalledWith(mockLead);
    expect(require('react-hot-toast').success).toHaveBeenCalled();
  });

  // בדיקות נוספות...
});

// src/__tests__/components/LeadsTable.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { LEAD_STATUSES } from '@/constants/statusTypes';

describe('LeadsTable', () => {
  const mockLeads = [
    {
      lead_id: '123',
      restaurant_name: 'Test Restaurant',
      contact_name: 'John Doe',
      phone: '123456789',
      email: 'john@example.com',
      lead_status: LEAD_STATUSES.NEW,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      ai_trainings_count: 0,
      ai_training_cost_per_unit: 1.5,
      ai_prompts_count: 0,
      ai_prompt_cost_per_unit: 0.16,
      total_ai_costs: 0,
      free_sample_package_active: false,
    },
  ];

  const mockProps = {
    leads: mockLeads,
    isLoading: false,
    error: null,
    onView: jest.fn(),
    onEdit: jest.fn(),
    onArchive: jest.fn(),
    onConvertToClient: jest.fn(),
    sortBy: 'created_at',
    sortDirection: 'desc' as const,
    onSort: jest.fn(),
  };

  test('renders leads correctly', () => {
    render(<LeadsTable {...mockProps} />);

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<LeadsTable {...mockProps} isLoading={true} />);

    expect(screen.getByText('טוען נתונים...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    render(<LeadsTable {...mockProps} error={new Error('Test error')} />);

    expect(screen.getByText('שגיאה בטעינת הנתונים')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  test('calls onView when restaurant name is clicked', () => {
    render(<LeadsTable {...mockProps} />);

    fireEvent.click(screen.getByText('Test Restaurant'));

    expect(mockProps.onView).toHaveBeenCalledWith(mockLeads[0]);
  });

  test('calls onSort when heading is clicked', () => {
    render(<LeadsTable {...mockProps} />);

    // Find the restaurant name heading and click it
    const headings = screen.getAllByRole('columnheader');
    fireEvent.click(headings[0]);

    expect(mockProps.onSort).toHaveBeenCalledWith('restaurant_name');
  });

  // בדיקות נוספות...
});

```

### 6.2 תיעוד

```markdown
# מערכת ניהול לידים - תיעוד מפורט

## סקירה כללית
מערכת ניהול הלידים מאפשרת מעקב אחר לקוחות פוטנציאליים, מדידת עלויות AI וחישוב ROI, וניהול מלא של תהליך ההמרה ללקוחות.

## מבנה נתונים

### טבלאות עיקריות
- `leads`: מידע על לידים פוטנציאליים
- `lead_activity_log`: היסטוריית פעילות עבור כל ליד
- `lead_comments`: הערות לגבי לידים
- `clients`: לקוחות שהומרו מלידים
- `ai_pricing_settings`: הגדרות מחירי AI ושערי חליפין

### מבנה טבלת `leads`
- `lead_id`: מזהה ייחודי (UUID)
- `restaurant_name`: שם המסעדה
- `contact_name`: שם איש הקשר
- `phone`: מספר טלפון
- `email`: כתובת אימייל
- `lead_status`: סטטוס הליד (enum מוגדר מראש)
- `lead_source`: מקור הליד (enum מוגדר מראש)
- `created_at`: תאריך יצירה
- `updated_at`: תאריך עדכון אחרון
- `next_follow_up_date`: תאריך מעקב הבא
- `next_follow_up_notes`: הערות למעקב הבא
- `notes`: הערות כלליות
- וכן שדות למעקב אחר עלויות AI, הכנסות ו-ROI

## ערכי Enum מוגדרים

### סטטוסי ליד
- ליד חדש
- פנייה ראשונית בוצעה
- מעוניין
- לא מעוניין
- נקבעה פגישה/שיחה
- הדגמה בוצעה
- הצעת מחיר נשלחה
- ממתין לתשובה
- הפך ללקוח
- ארכיון (אופציונלי)

### מקורות ליד
- אתר
- הפניה
- פייסבוק
- אינסטגרם
- אחר

## תהליכים עיקריים

### יצירת ליד
- יצירה ידנית דרך הממשק
- יצירה אוטומטית מהגשות של לקוחות

### עדכון סטטוס ליד
1. עדכון דרך עמוד הלידים הראשי
2. עדכון דרך פאנל פרטי ליד
3. לוג אוטומטי של כל שינוי סטטוס

### מעקב אחר עלויות AI ו-ROI
1. עדכון כמות אימונים ומחיר ליחידה
2. עדכון כמות פרומפטים ומחיר ליחידה
3. חישוב אוטומטי של סך עלויות
4. עדכון הכנסות מליד
5. חישוב אוטומטי של ROI

### המרת ליד ללקוח
1. בדיקה אם הלקוח כבר קיים
2. יצירת רשומת לקוח חדשה (אם צריך)
3. עדכון סטטוס הליד ל-"הפך ללקוח"
4. יצירת קישור בין הליד ללקוח
5. תיעוד הפעולה בלוג הפעילות

## API ומודלים

### API הלידים
- `fetchLeads`: שליפת לידים עם פילטרים
- `fetchLeadById`: שליפת ליד לפי מזהה
- `createLead`: יצירת ליד חדש
- `updateLead`: עדכון ליד קיים
- `archiveLead`: העברת ליד לארכיון
- `convertToClient`: המרת ליד ללקוח
- `addLeadActivity`: הוספת פעילות ללוג

### React Query Hooks
- `useLeads`: שליפת רשימת לידים
- `useLeadDetails`: שליפת פרטי ליד בודד
- `useCreateLead`: יצירת ליד חדש
- `useUpdateLead`: עדכון ליד
- `useArchiveLead`: העברה לארכיון
- `useConvertLeadToClient`: המרה ללקוח

## רכיבי UI

### עמודים
- `AdminLeadsPage`: עמוד ניהול לידים ראשי
- `AdminLeadsArchivePage`: עמוד ארכיון לידים
- `AdminCostsReportPage`: דוח עלויות ו-ROI

### רכיבים
- `LeadsTable`: טבלת הצגת לידים
- `LeadsFilters`: פילטרים לחיפוש לידים
- `LeadForm`: טופס יצירה/עריכת ליד
- `LeadDetailsPanel`: פאנל פרטי ליד
- `StatusBadge`: תגית סטטוס עם צבע דינמי

## תרשים זרימת עבודה

```

הגשה דרך טופס ציבורי → בדיקת קיום ליד/לקוח → יצירת ליד חדש
↓
┌─────────────────────────────────────────→ עדכון פרטים ומעקב
│                                            ↓
└──────────────← שינוי סטטוס ←───────────────┘
↓
"הפך ללקוח" → המרה ללקוח

```

## התקנה והתחלה

### דרישות מקדימות
- Node.js 16+
- Supabase פרויקט מוגדר

### הגדרת מסד נתונים
1. צור את הטבלאות כמוגדר בסכמה
2. הוסף את ה-enums הדרושים
3. הגדר את ה-RPC functions

### הגדרת הפרונטאנד
1. התקן את ה-dependencies
2. הגדר את משתני הסביבה
3. הפעל את הפיתוח או בנה לייצור

```

## שלב 7: תחזוקה והמשך פיתוח (תכנית לטווח ארוך)

### 7.1 מעקב שגיאות ושיפורים

1. **ניטור שגיאות**:
    - הוספת לוגים מפורטים יותר
    - הגדרת התראות על שגיאות חוזרות
    - ניטור ביצועים של שאילתות מורכבות
2. **שיפורים עתידיים**:
    - תמיכה בתרגום דינמי לשפות נוספות
    - הוספת גרפים וויזואליזציות לדוחות
    - שילוב עם מערכות CRM חיצוניות
    - הוספת התראות אוטומטיות למעקב אחרי לידים
3. **בקשות משתמשים**:
    - תהליך מובנה לאיסוף משוב
    - תיעוד בקשות חדשות
    - תעדוף לפי צרכי העסק

### 7.2 עדכונים עונתיים

1. **רבעון 1 (אחרי השדרוג הראשוני)**:
    - שיפור ביצועים וטיפול בבאגים
    - הוספת בדיקות אוטומטיות נוספות
    - שיפור UX בהתאם למשוב ראשוני
2. **רבעון 2**:
    - הוספת דוחות מתקדמים
    - תכונות ניתוח נתונים מתקדמות
    - שיפור אינטגרציה עם מערכות קיימות
3. **רבעון 3+**:
    - פיתוח יכולות חיזוי מבוססות AI לזיהוי לידים בעלי סיכוי המרה גבוה
    - אוטומציה נוספת של תהליכי מעקב
    - שילוב עם מערכות שיווק נוספות

## סיכום תוכנית הרפקטורינג

תוכנית זו מציגה גישה הדרגתית ומקיפה לשדרוג מערכת ניהול הלידים, תוך שימת דגש על:

1. **סטנדרטיזציה של מבני נתונים** - הגדרות אחידות ומרכזיות
2. **שכבת אבסטרקציה מעל הגישה לנתונים** - API נקי וקריא
3. **הפרדת הלוגיקה העסקית מהתצוגה** - הוקים ושירותים מופרדים
4. **קומפוננטות UI מודולריות ונגישות** - ממשק משתמש עקבי
5. **בדיקות אוטומטיות ותיעוד מקיף** - איכות ותחזוקתיות לאורך זמן

התהליך מתוכנן להימשך כ-6 שבועות לשלב הראשוני, עם תוכנית המשך לשיפורים ותחזוקה שוטפת.

בתחילת הדרך מטפלים בבעיות הקריטיות באופן מיידי (אי התאמות ב-enum וב-column names), ובהמשך מיישמים את השיפורים הארכיטקטוניים בצורה הדרגתית ומבוקרת.