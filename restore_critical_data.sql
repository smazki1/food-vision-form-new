-- Critical Data Recovery Script
-- This script extracts only the essential business data from backup
-- Safe to run - only INSERTs, no schema changes

BEGIN;

-- 1. Restore Clients (7 records)
INSERT INTO public.clients (client_id, restaurant_name, contact_name, phone, email, created_at, original_lead_id, client_status, current_package_id, remaining_servings, last_activity_at, internal_notes, user_auth_id, email_notifications, app_notifications) VALUES
('594148c2-5215-4bf9-9023-44bc90ea294e', 'cscac', 'נועdsafasdfה חמו', '13123', 'assac@demo.com', '2025-05-20 18:50:28.277535+00', NULL, 'פעיל', 'de117d08-3dbd-44ee-86fa-4a13af97db61', 0, '2025-05-20 18:50:29.056098+00', NULL, NULL, true, true),
('91e25dfe-d32d-4620-ac14-a22c2afd36fd', 'asdasd', 'rrtrt', '05277738123', 'avifridsd121@gmail.coasd', '2025-06-02 14:45:20.238037+00', '4b4e221d-6519-4ab2-a421-6aa2f41d9dc0', 'פעיל', NULL, 0, '2025-06-02 14:45:20.238037+00', NULL, NULL, true, true),
('2fb791e1-8433-4a5d-9825-75a109c4f9c2', 'הגשה אנונימית - asdsad', 'משתמש אנונימי', '000-0000000', 'anonymous+efe0612f98d544469cd32e3dac4af8a7@foodvision.demo', '2025-06-02 14:45:45.357337+00', '3170650b-6ca7-4fb3-8c01-4331a72bdf0b', 'פעיל', NULL, 0, '2025-06-02 14:45:45.357337+00', NULL, NULL, true, true),
('340ac6a6-d0c5-4cb4-b091-f1acde850f1e', 'מסעדה בבדיקה 112', 'בודק 112', '111111111111313', 'test12a@.com', '2025-05-20 17:03:46.494081+00', NULL, 'פעיל', '2ab154ff-e697-495e-85e1-8a3cffff2f82', 5, '2025-05-24 12:39:59.688353+00', NULL, NULL, true, true),
('ca42c172-fbd4-46d2-b7b4-c77a65e9d098', 'בדיקה98', 'שכדשדכ', '2321412412412', '121212@demo.com', '2025-05-20 17:52:55.564293+00', NULL, 'פעיל', 'de117d08-3dbd-44ee-86fa-4a13af97db61', 0, '2025-05-20 17:52:56.291701+00', NULL, NULL, true, true),
('58220173-08a9-490c-8c39-b69990b68128', 'בדיקה 12', 'אבי פריד', '0527772807', 'tes23t@gmail.com', '2025-05-24 12:56:42.152911+00', 'fe092856-4ad5-4c9b-a1be-1e5f64f65e03', 'פעיל', '2ab154ff-e697-495e-85e1-8a3cffff2f82', 5, '2025-05-24 12:56:42.152911+00', NULL, NULL, true, true),
('85f8881d-441a-4f24-9293-e6e295490ed1', 'חוף בלנגה', 'נועה חמו', '0543355318', 'balanga@demo.com', '2025-04-29 15:10:49.114332+00', NULL, 'פעיל', '05741360-e657-4e3b-a3f1-beb32e0a3807', 29, '2025-05-30 15:46:54.248153+00', E'\nData consolidated for Belanga Beach under user balanga@demo.com. Initial package 85 servings, 30 historical servings accounted for. Updated on 2025-05-17', '6d194e4e-e6f9-4831-8594-183900c6f003', false, false)
ON CONFLICT (client_id) DO NOTHING;

-- 2. Restore Key Leads (first 10 most important)
INSERT INTO public.leads (lead_id, restaurant_name, contact_name, phone, email, lead_status, lead_source, created_at, updated_at, notes, next_follow_up_date, next_follow_up_notes, free_sample_package_active, website_url, address, ai_trainings_count, ai_training_cost_per_unit, ai_prompts_count, ai_prompt_cost_per_unit, revenue_from_lead_local, exchange_rate_at_conversion, client_id, business_type, is_archived, lora_page_url, style_description, custom_prompt, reminder_notes, conversion_reason, rejection_reason, ai_training_25_count, ai_training_15_count, ai_training_5_count, archived_at) VALUES
('bd72926c-d3cf-4fc1-a769-ee2e7ed61389', 'גכגדכ', 'שגדכדגכ', '3242341234', 'avifrid1we21@gmail.com', 'מעוניין', 'הפניה', '2025-06-02 18:09:14.671526+00', '2025-06-02 18:29:29.286362+00', 'asdfsdf', NULL, NULL, true, NULL, '3 ח', 0, 1.50, 0, 0.16, 100.00, NULL, NULL, 'מאפייה', false, NULL, NULL, NULL, NULL, NULL, NULL, 3, 0, 0, NULL),
('06c71fd9-4296-49c6-81cb-6d77a86c134b', 'ghg', 'jgj', '0527798807', 'avifrjhjhid121@gmail.com', 'פנייה ראשונית בוצעה', 'טלמרקטינג', '2025-06-02 17:33:57.5072+00', '2025-06-02 17:34:35.37238+00', 'jhjh', NULL, NULL, true, NULL, '3 ח', 0, 1.50, 76, 0.16, NULL, NULL, NULL, 'בית קפה', false, NULL, NULL, NULL, NULL, NULL, NULL, 1, 3, 0, NULL),
('393e383a-f8df-4551-9282-370148082e1e', 'aaa123', 'aaa321', '123432121321', 'aa12@gmail.com', 'מעוניין', 'אתר', '2025-06-02 17:39:11.877457+00', '2025-06-02 18:03:57.595508+00', NULL, '2025-06-03 17:39:11.877457+00', NULL, true, NULL, NULL, 0, 1.50, 0, 0.16, 0.00, NULL, NULL, 'מסעדה', false, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
('3170650b-6ca7-4fb3-8c01-4331a72bdf0b', 'בדיקה', 'בודק1212', '000-0002003', 'anonymous+efe0612f98d544469cd32e3dac4af8a7@foodvision.demo', 'פנייה ראשונית בוצעה', 'טלמרקטינג', '2025-06-01 19:12:45.829091+00', '2025-06-02 17:31:29.018002+00', 'ליד שנוצר אוטומטית עבור הגשה אנונימית. פריט: asdsad, סוג: dish. תאריך הגשה מקורי: 2025-06-01 19:12:45.829091+00', '2025-06-08 19:41:20.973813+00', NULL, false, 'www.tesdt.co.il', 'כגדכגד', 0, 1.50, 0, 0.16, 0.00, NULL, '2fb791e1-8433-4a5d-9825-75a109c4f9c2', 'פיצרייה', false, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
('b1633a25-6916-47c5-8dc6-630051e0ce7d', 'Ddffגכגכ', 'Fff', '+972527772884', 'avifrid121xc@gmail.comasd', 'ליד חדש', 'אתר', '2025-06-02 20:50:30.327548+00', '2025-06-02 21:07:01.621634+00', NULL, '2025-06-03 20:50:30.327548+00', NULL, false, 'd', 'sd', 0, 1.50, 0, 0.16, 0.00, NULL, NULL, 'קייטרינג', false, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
('4b4e221d-6519-4ab2-a421-6aa2f41d9dc0', 'asdasd', 'rrtrt', '05277738123', 'avifridsd121@gmail.coasd', 'ארכיון', NULL, '2025-06-02 13:13:54.762551+00', '2025-06-02 14:46:11.045138+00', NULL, NULL, NULL, false, NULL, '3 ח', 0, 1.50, 0, 0.16, 0.00, NULL, '91e25dfe-d32d-4620-ac14-a22c2afd36fd', 'מסעדה', false, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, '2025-06-02 14:46:10.59+00'),
('b43b1424-da84-41e5-9472-931be837792b', 'בדיקה 12', 'טסט', '0527773807', 'test121212@gmail.com', 'ליד חדש', NULL, '2025-05-27 10:18:49.863405+00', '2025-05-27 10:19:00.143931+00', '', NULL, NULL, true, NULL, NULL, 0, 1.50, 0, 0.16, 0.00, NULL, NULL, 'מסעדה', false, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL),
('ce83aeb1-9819-4b19-bbbf-329383c3743b', 'רפאל', 'רפאל', '⁦+972 55-667-9741⁩', 'refal1@gmail.com', 'ליד חדש', NULL, '2025-05-27 12:28:22.050272+00', '2025-05-27 12:28:22.050272+00', NULL, NULL, NULL, false, NULL, NULL, 0, 1.50, 0, 0.16, 0.00, NULL, NULL, 'מסעדה', false, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL)
ON CONFLICT (lead_id) DO NOTHING;

COMMIT;

-- Summary report
SELECT 'RECOVERY COMPLETE' as status, 
       (SELECT COUNT(*) FROM clients) as restored_clients,
       (SELECT COUNT(*) FROM leads) as restored_leads; 