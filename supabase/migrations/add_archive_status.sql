-- במידה ורוצים להוסיף את הערך "ארכיון" ל-enum
-- src/migrations/add_archive_status.sql
ALTER TYPE lead_status_type ADD VALUE 'ארכיון' AFTER 'הפך ללקוח';

-- הערה: אם הטיפוס lead_status_type אינו קיים או ששמו שונה,
-- יש להתאים את הפקודה לשם הטיפוס הנכון בבסיס הנתונים שלך.
-- כמו כן, יש לוודא שהערך 'הפך ללקוח' קיים ב-enum לפני הרצת פקודה זו.

-- או, אם יש צורך לסנכרן את כל הערכים (זה דורש יצירת enum חדש):
-- CREATE TYPE lead_status_type_new AS ENUM (
--   'ליד חדש',
--   'פנייה ראשונית בוצעה',
--   'מעוניין',
--   'לא מעוניין',
--   'נקבעה פגישה/שיחה',
--   'הדגמה בוצעה',
--   'הצעת מחיר נשלחה',
--   'ממתין לתשובה',
--   'הפך ללקוח',
--   'ארכיון'
-- );
-- ALTER TABLE leads ALTER COLUMN lead_status TYPE lead_status_type_new USING lead_status::text::lead_status_type_new;
-- DROP TYPE lead_status_type;
-- ALTER TYPE lead_status_type_new RENAME TO lead_status_type; 