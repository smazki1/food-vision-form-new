create type "public"."client_status_type" as enum ('פעיל', 'לא פעיל', 'בהמתנה');

create type "public"."lead_source_type" as enum ('אתר', 'הפניה', 'פייסבוק', 'אינסטגרם', 'אחר');

create type "public"."lead_status_type" as enum ('ליד חדש', 'פנייה ראשונית בוצעה', 'מעוניין', 'לא מעוניין', 'נקבעה פגישה/שיחה', 'הדגמה בוצעה', 'הצעת מחיר נשלחה', 'ממתין לתשובה', 'הפך ללקוח');

drop policy "Admins can view all client records" on "public"."clients";

drop policy "admin_full_access" on "public"."clients";

drop policy "clients_select_own" on "public"."clients";

drop policy "clients_update_own" on "public"."clients";

drop policy "customers_create_submissions" on "public"."customer_submissions";

drop policy "customers_update_submissions" on "public"."customer_submissions";

drop policy "customers_view_own_submissions" on "public"."customer_submissions";

alter table "public"."customer_submissions" drop constraint "valid_item_type";

alter table "public"."clients" drop constraint "clients_current_package_id_fkey";

drop function if exists "public"."check_client_ownership"(client_id uuid);

drop function if exists "public"."get_user_client_id"();

drop function if exists "public"."public_submit_item_by_restaurant_name"(p_restaurant_name text, p_item_type text, p_item_name text, p_description text, p_notes text, p_reference_image_urls text[]);

alter table "public"."cocktails" drop constraint "cocktails_pkey";

alter table "public"."dishes" drop constraint "dishes_pkey";

alter table "public"."drinks" drop constraint "drinks_pkey";

alter table "public"."leads" drop constraint "leads_pkey";

drop index if exists "public"."cocktails_pkey";

drop index if exists "public"."dishes_pkey";

drop index if exists "public"."drinks_pkey";

drop index if exists "public"."leads_pkey";

create table "public"."additional_details" (
    "client_id" uuid not null,
    "visual_style" text,
    "brand_colors" text,
    "branding_materials_url" text,
    "general_notes" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."additional_details" enable row level security;

create table "public"."client_packages" (
    "id" uuid not null default uuid_generate_v4(),
    "client_id" uuid not null,
    "package_name" text not null,
    "total_dishes" integer not null,
    "remaining_dishes" integer not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


create table "public"."messages" (
    "message_id" uuid not null default gen_random_uuid(),
    "submission_id" uuid not null,
    "sender_type" text not null,
    "sender_id" uuid not null,
    "content" text not null,
    "timestamp" timestamp with time zone not null default now(),
    "read_status" boolean not null default false
);


alter table "public"."messages" enable row level security;

create table "public"."notifications" (
    "notification_id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "message" text not null,
    "link" text,
    "related_entity_id" uuid,
    "related_entity_type" text,
    "created_at" timestamp with time zone not null default now(),
    "read_status" boolean not null default false
);


alter table "public"."notifications" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" text not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."visual_styles" (
    "style_id" uuid not null default gen_random_uuid(),
    "style_name" text not null,
    "image_url" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."visual_styles" enable row level security;

alter table "public"."clients" drop column "updated_at";

alter table "public"."clients" add column "client_status" client_status_type not null default 'פעיל'::client_status_type;

alter table "public"."clients" add column "internal_notes" text;

alter table "public"."clients" add column "last_activity_at" timestamp with time zone not null default now();

alter table "public"."clients" add column "original_lead_id" uuid;

alter table "public"."clients" alter column "created_at" set default now();

alter table "public"."clients" alter column "phone" set not null;

alter table "public"."clients" alter column "remaining_servings" set not null;

alter table "public"."clients" alter column "user_auth_id" drop not null;

alter table "public"."clients" disable row level security;

alter table "public"."cocktails" drop column "id";

alter table "public"."cocktails" drop column "updated_at";

alter table "public"."cocktails" add column "cocktail_id" uuid not null default gen_random_uuid();

alter table "public"."cocktails" add column "ingredients" text;

alter table "public"."cocktails" alter column "client_id" set not null;

alter table "public"."cocktails" alter column "created_at" set default now();

alter table "public"."cocktails" alter column "reference_image_urls" set default '{}'::text[];

alter table "public"."cocktails" enable row level security;

alter table "public"."customer_submissions" drop column "original_image_urls";

alter table "public"."customer_submissions" drop column "processed_at";

alter table "public"."customer_submissions" add column "assigned_package_id_at_submission" uuid;

alter table "public"."customer_submissions" add column "created_at" timestamp with time zone not null default now();

alter table "public"."customer_submissions" add column "edit_count" integer default 0;

alter table "public"."customer_submissions" add column "internal_team_notes" text;

alter table "public"."customer_submissions" add column "original_item_id" uuid not null;

alter table "public"."customer_submissions" add column "priority" text default 'Medium'::text;

alter table "public"."customer_submissions" add column "status_בעיבוד_at" timestamp with time zone;

alter table "public"."customer_submissions" add column "status_הושלמה_ואושרה_at" timestamp with time zone;

alter table "public"."customer_submissions" add column "status_הערות_התקבלו_at" timestamp with time zone;

alter table "public"."customer_submissions" add column "status_מוכנה_להצגה_at" timestamp with time zone;

alter table "public"."customer_submissions" add column "status_ממתינה_לעיבוד_at" timestamp with time zone;

alter table "public"."customer_submissions" add column "target_completion_date" timestamp with time zone;

alter table "public"."customer_submissions" alter column "client_id" set not null;

alter table "public"."customer_submissions" alter column "edit_history" drop default;

alter table "public"."customer_submissions" alter column "processed_image_urls" set default '{}'::text[];

alter table "public"."customer_submissions" alter column "uploaded_at" set default now();

alter table "public"."dishes" drop column "id";

alter table "public"."dishes" drop column "updated_at";

alter table "public"."dishes" add column "dish_id" uuid not null default gen_random_uuid();

alter table "public"."dishes" add column "ingredients" text;

alter table "public"."dishes" alter column "client_id" set not null;

alter table "public"."dishes" alter column "created_at" set default now();

alter table "public"."dishes" alter column "reference_image_urls" set default '{}'::text[];

alter table "public"."dishes" enable row level security;

alter table "public"."drinks" drop column "id";

alter table "public"."drinks" drop column "updated_at";

alter table "public"."drinks" add column "drink_id" uuid not null default gen_random_uuid();

alter table "public"."drinks" add column "ingredients" text;

alter table "public"."drinks" alter column "client_id" set not null;

alter table "public"."drinks" alter column "created_at" set default now();

alter table "public"."drinks" alter column "reference_image_urls" set default '{}'::text[];

alter table "public"."drinks" enable row level security;

alter table "public"."leads" drop column "lead_id";

alter table "public"."leads" drop column "message";

alter table "public"."leads" drop column "phone";

alter table "public"."leads" drop column "status";

alter table "public"."leads" drop column "updated_at";

alter table "public"."leads" add column "free_sample_package_active" boolean not null default false;

alter table "public"."leads" add column "id" uuid not null default gen_random_uuid();

alter table "public"."leads" add column "last_updated_at" timestamp with time zone not null default now();

alter table "public"."leads" add column "lead_source" lead_source_type;

alter table "public"."leads" add column "lead_status" lead_status_type not null default 'ליד חדש'::lead_status_type;

alter table "public"."leads" add column "notes" text;

alter table "public"."leads" add column "phone_number" text not null;

alter table "public"."leads" add column "reminder_at" timestamp with time zone;

alter table "public"."leads" add column "reminder_details" text;

alter table "public"."leads" alter column "created_at" set default now();

alter table "public"."service_packages" drop column "name";

alter table "public"."service_packages" add column "features_tags" text[];

alter table "public"."service_packages" add column "max_edits_per_serving" integer not null default 1;

alter table "public"."service_packages" add column "max_processing_time_days" integer;

alter table "public"."service_packages" add column "package_name" text not null;

alter table "public"."service_packages" alter column "created_at" set default now();

alter table "public"."service_packages" alter column "is_active" set not null;

alter table "public"."service_packages" alter column "price" set default 0.00;

alter table "public"."service_packages" alter column "total_servings" set default 0;

alter table "public"."service_packages" alter column "updated_at" set default now();

CREATE UNIQUE INDEX additional_details_pkey ON public.additional_details USING btree (client_id);

CREATE UNIQUE INDEX client_packages_pkey ON public.client_packages USING btree (id);

CREATE UNIQUE INDEX clients_user_auth_id_key ON public.clients USING btree (user_auth_id);

CREATE INDEX idx_clients_client_status ON public.clients USING btree (client_status);

CREATE INDEX idx_clients_last_activity_at ON public.clients USING btree (last_activity_at);

CREATE INDEX idx_clients_original_lead_id ON public.clients USING btree (original_lead_id);

CREATE INDEX idx_customer_submissions_client_id ON public.customer_submissions USING btree (client_id);

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at);

CREATE INDEX idx_leads_email ON public.leads USING btree (email);

CREATE INDEX idx_leads_last_updated_at ON public.leads USING btree (last_updated_at);

CREATE INDEX idx_leads_lead_status ON public.leads USING btree (lead_status);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE UNIQUE INDEX leads_email_key ON public.leads USING btree (email);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (message_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (notification_id);

CREATE UNIQUE INDEX service_packages_package_name_key ON public.service_packages USING btree (package_name);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

CREATE UNIQUE INDEX user_roles_user_id_unique ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX visual_styles_pkey ON public.visual_styles USING btree (style_id);

CREATE UNIQUE INDEX cocktails_pkey ON public.cocktails USING btree (cocktail_id);

CREATE UNIQUE INDEX dishes_pkey ON public.dishes USING btree (dish_id);

CREATE UNIQUE INDEX drinks_pkey ON public.drinks USING btree (drink_id);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

alter table "public"."additional_details" add constraint "additional_details_pkey" PRIMARY KEY using index "additional_details_pkey";

alter table "public"."client_packages" add constraint "client_packages_pkey" PRIMARY KEY using index "client_packages_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."visual_styles" add constraint "visual_styles_pkey" PRIMARY KEY using index "visual_styles_pkey";

alter table "public"."cocktails" add constraint "cocktails_pkey" PRIMARY KEY using index "cocktails_pkey";

alter table "public"."dishes" add constraint "dishes_pkey" PRIMARY KEY using index "dishes_pkey";

alter table "public"."drinks" add constraint "drinks_pkey" PRIMARY KEY using index "drinks_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."additional_details" add constraint "additional_details_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE not valid;

alter table "public"."additional_details" validate constraint "additional_details_client_id_fkey";

alter table "public"."client_packages" add constraint "client_packages_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(client_id) not valid;

alter table "public"."client_packages" validate constraint "client_packages_client_id_fkey";

alter table "public"."client_packages" add constraint "remaining_dishes_check" CHECK (((remaining_dishes >= 0) AND (remaining_dishes <= total_dishes))) not valid;

alter table "public"."client_packages" validate constraint "remaining_dishes_check";

alter table "public"."clients" add constraint "clients_user_auth_id_key" UNIQUE using index "clients_user_auth_id_key";

alter table "public"."cocktails" add constraint "cocktails_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE not valid;

alter table "public"."cocktails" validate constraint "cocktails_client_id_fkey";

alter table "public"."customer_submissions" add constraint "customer_submissions_assigned_package_id_at_submission_fkey" FOREIGN KEY (assigned_package_id_at_submission) REFERENCES service_packages(package_id) not valid;

alter table "public"."customer_submissions" validate constraint "customer_submissions_assigned_package_id_at_submission_fkey";

alter table "public"."customer_submissions" add constraint "customer_submissions_item_type_check" CHECK ((item_type = ANY (ARRAY['dish'::text, 'cocktail'::text, 'drink'::text]))) not valid;

alter table "public"."customer_submissions" validate constraint "customer_submissions_item_type_check";

alter table "public"."dishes" add constraint "dishes_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE not valid;

alter table "public"."dishes" validate constraint "dishes_client_id_fkey";

alter table "public"."drinks" add constraint "drinks_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE not valid;

alter table "public"."drinks" validate constraint "drinks_client_id_fkey";

alter table "public"."leads" add constraint "leads_email_key" UNIQUE using index "leads_email_key";

alter table "public"."messages" add constraint "messages_sender_type_check" CHECK ((sender_type = ANY (ARRAY['client'::text, 'team'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_sender_type_check";

alter table "public"."messages" add constraint "messages_submission_id_fkey" FOREIGN KEY (submission_id) REFERENCES customer_submissions(submission_id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_submission_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."service_packages" add constraint "service_packages_package_name_key" UNIQUE using index "service_packages_package_name_key";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

alter table "public"."user_roles" add constraint "user_roles_user_id_unique" UNIQUE using index "user_roles_user_id_unique";

alter table "public"."clients" add constraint "clients_current_package_id_fkey" FOREIGN KEY (current_package_id) REFERENCES service_packages(package_id) ON UPDATE CASCADE ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED not valid;

alter table "public"."clients" validate constraint "clients_current_package_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.decrement_client_servings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if client has enough servings
  IF (SELECT remaining_servings FROM public.clients WHERE client_id = NEW.client_id) > 0 THEN
    -- Decrement the remaining_servings
    UPDATE public.clients
    SET remaining_servings = remaining_servings - 1,
        last_activity_at = now()
    WHERE client_id = NEW.client_id;
  ELSE
    -- If no servings are left, raise an exception
    RAISE EXCEPTION 'Not enough remaining servings for client %', NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_for_user(user_auth_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT client_id FROM clients WHERE user_auth_id = get_client_for_user.user_auth_id LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_id(p_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT client_id FROM clients WHERE user_auth_id = p_user_id LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_auth_data(user_uid uuid)
 RETURNS TABLE(user_role text, client_id uuid, restaurant_name text, has_client_record boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First check if user has an explicit role (admin/editor)
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_uid
  LIMIT 1;
  
  -- If user has an explicit role, they're staff (no client record)
  IF user_role IS NOT NULL THEN
    RETURN QUERY SELECT 
      user_role,
      NULL::uuid as client_id,
      NULL::text as restaurant_name,
      false as has_client_record;
    RETURN;
  END IF;
  
  -- Check for client record (customer role)
  SELECT c.client_id, c.restaurant_name
  INTO client_id, restaurant_name
  FROM public.clients c
  WHERE c.user_auth_id = user_uid
  LIMIT 1;
  
  -- If client record exists, user is a customer
  IF client_id IS NOT NULL THEN
    RETURN QUERY SELECT 
      'customer'::text as user_role,
      client_id,
      restaurant_name,
      true as has_client_record;
    RETURN;
  END IF;
  
  -- User has no role and no client record
  RETURN QUERY SELECT 
    NULL::text as user_role,
    NULL::uuid as client_id,
    NULL::text as restaurant_name,
    false as has_client_record;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_client_id(user_uid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  _client_id TEXT;
BEGIN
  -- ASSUMPTION: The 'clients' table has a 'user_auth_id' column
  -- that links to the 'id' from the 'auth.users' table.
  -- If your column is named differently (e.g., auth_user_id, user_id),
  -- please adjust the 'user_auth_id' in the SELECT query below.
  SELECT client_id INTO _client_id
  FROM public.clients
  WHERE user_auth_id = user_uid; -- Ensure this column name is correct!
  
  RETURN _client_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE public.user_roles.user_id = $1 AND role = $2
  );
END;$function$
;

CREATE OR REPLACE FUNCTION public.is_account_manager()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'account_manager'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_account_manager()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  user_role_value TEXT;
BEGIN
  -- Get the role of the current user
  SELECT public.get_my_role() INTO user_role_value;

  -- Check if the role is 'admin' or 'account_manager'
  RETURN user_role_value = 'admin' OR user_role_value = 'account_manager';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_client_owner(client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM clients 
    WHERE clients.client_id = is_client_owner.client_id 
    AND clients.user_auth_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_client_activity_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.last_activity_at = now();
   RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_lead_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.last_updated_at = now();
   RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_package_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  user_role_value TEXT;
BEGIN
  SELECT role
  INTO user_role_value
  FROM public.user_roles
  WHERE user_id = auth.uid();

  RETURN user_role_value;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_editor()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'editor'
  );
$function$
;

grant delete on table "public"."additional_details" to "anon";

grant insert on table "public"."additional_details" to "anon";

grant references on table "public"."additional_details" to "anon";

grant select on table "public"."additional_details" to "anon";

grant trigger on table "public"."additional_details" to "anon";

grant truncate on table "public"."additional_details" to "anon";

grant update on table "public"."additional_details" to "anon";

grant delete on table "public"."additional_details" to "authenticated";

grant insert on table "public"."additional_details" to "authenticated";

grant references on table "public"."additional_details" to "authenticated";

grant select on table "public"."additional_details" to "authenticated";

grant trigger on table "public"."additional_details" to "authenticated";

grant truncate on table "public"."additional_details" to "authenticated";

grant update on table "public"."additional_details" to "authenticated";

grant delete on table "public"."additional_details" to "service_role";

grant insert on table "public"."additional_details" to "service_role";

grant references on table "public"."additional_details" to "service_role";

grant select on table "public"."additional_details" to "service_role";

grant trigger on table "public"."additional_details" to "service_role";

grant truncate on table "public"."additional_details" to "service_role";

grant update on table "public"."additional_details" to "service_role";

grant delete on table "public"."client_packages" to "anon";

grant insert on table "public"."client_packages" to "anon";

grant references on table "public"."client_packages" to "anon";

grant select on table "public"."client_packages" to "anon";

grant trigger on table "public"."client_packages" to "anon";

grant truncate on table "public"."client_packages" to "anon";

grant update on table "public"."client_packages" to "anon";

grant delete on table "public"."client_packages" to "authenticated";

grant insert on table "public"."client_packages" to "authenticated";

grant references on table "public"."client_packages" to "authenticated";

grant select on table "public"."client_packages" to "authenticated";

grant trigger on table "public"."client_packages" to "authenticated";

grant truncate on table "public"."client_packages" to "authenticated";

grant update on table "public"."client_packages" to "authenticated";

grant delete on table "public"."client_packages" to "service_role";

grant insert on table "public"."client_packages" to "service_role";

grant references on table "public"."client_packages" to "service_role";

grant select on table "public"."client_packages" to "service_role";

grant trigger on table "public"."client_packages" to "service_role";

grant truncate on table "public"."client_packages" to "service_role";

grant update on table "public"."client_packages" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."visual_styles" to "anon";

grant insert on table "public"."visual_styles" to "anon";

grant references on table "public"."visual_styles" to "anon";

grant select on table "public"."visual_styles" to "anon";

grant trigger on table "public"."visual_styles" to "anon";

grant truncate on table "public"."visual_styles" to "anon";

grant update on table "public"."visual_styles" to "anon";

grant delete on table "public"."visual_styles" to "authenticated";

grant insert on table "public"."visual_styles" to "authenticated";

grant references on table "public"."visual_styles" to "authenticated";

grant select on table "public"."visual_styles" to "authenticated";

grant trigger on table "public"."visual_styles" to "authenticated";

grant truncate on table "public"."visual_styles" to "authenticated";

grant update on table "public"."visual_styles" to "authenticated";

grant delete on table "public"."visual_styles" to "service_role";

grant insert on table "public"."visual_styles" to "service_role";

grant references on table "public"."visual_styles" to "service_role";

grant select on table "public"."visual_styles" to "service_role";

grant trigger on table "public"."visual_styles" to "service_role";

grant truncate on table "public"."visual_styles" to "service_role";

grant update on table "public"."visual_styles" to "service_role";

create policy "Admins have full access to additional details"
on "public"."additional_details"
as permissive
for all
to authenticated
using ((is_admin() OR is_account_manager()));


create policy "Allow full access to additional_details"
on "public"."additional_details"
as permissive
for all
to public
using (true);


create policy "Customers can manage their own additional details"
on "public"."additional_details"
as permissive
for all
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))))
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "Editors can view additional details related to their submission"
on "public"."additional_details"
as permissive
for select
to authenticated
using ((is_editor() AND (EXISTS ( SELECT 1
   FROM customer_submissions
  WHERE ((customer_submissions.client_id = additional_details.client_id) AND (customer_submissions.assigned_editor_id = auth.uid()))))));


create policy "Admins and Account Managers can view all client records"
on "public"."clients"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'account_manager'::text]))))));


create policy "Allow anonymous creation of client records"
on "public"."clients"
as permissive
for insert
to anon
with check (true);


create policy "Allow_Authenticated_User_To_Select_Own_Client_Record"
on "public"."clients"
as permissive
for select
to authenticated
using ((auth.uid() = user_auth_id));


create policy "Allow_Authenticated_User_To_Update_Own_Client_Record"
on "public"."clients"
as permissive
for update
to authenticated
using ((auth.uid() = user_auth_id))
with check ((auth.uid() = user_auth_id));


create policy "Allow_Editor_Via_JWT_To_View_Client_Records"
on "public"."clients"
as permissive
for select
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'editor'::text));


create policy "ServiceRole_Manage_All_Client_Records"
on "public"."clients"
as permissive
for all
to service_role
using (true);


create policy "Admins have full access to cocktails"
on "public"."cocktails"
as permissive
for all
to authenticated
using ((is_admin() OR is_account_manager()));


create policy "Allow full access to cocktails"
on "public"."cocktails"
as permissive
for all
to public
using (true);


create policy "Customers can manage their own cocktails"
on "public"."cocktails"
as permissive
for all
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))))
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "Editors can view cocktails related to their submissions"
on "public"."cocktails"
as permissive
for select
to authenticated
using ((is_editor() AND (EXISTS ( SELECT 1
   FROM customer_submissions
  WHERE ((customer_submissions.original_item_id = cocktails.cocktail_id) AND (customer_submissions.assigned_editor_id = auth.uid()))))));


create policy "Admins have full access to submissions"
on "public"."customer_submissions"
as permissive
for all
to authenticated
using ((is_admin() OR is_account_manager()));


create policy "Allow anonymous insertions to customer_submissions"
on "public"."customer_submissions"
as permissive
for insert
to anon
with check (true);


create policy "Customers can create new submissions"
on "public"."customer_submissions"
as permissive
for insert
to authenticated
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "Customers can update submission feedback and approval"
on "public"."customer_submissions"
as permissive
for update
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))))
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "Customers can view their own submissions"
on "public"."customer_submissions"
as permissive
for select
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "Editors can manage assigned submissions"
on "public"."customer_submissions"
as permissive
for select
to authenticated
using ((is_editor() AND (assigned_editor_id = auth.uid())));


create policy "Editors can update assigned submissions"
on "public"."customer_submissions"
as permissive
for update
to authenticated
using ((is_editor() AND (assigned_editor_id = auth.uid())))
with check ((is_editor() AND (assigned_editor_id = auth.uid())));


create policy "editors_update_assigned_submissions"
on "public"."customer_submissions"
as permissive
for update
to authenticated
using (((assigned_editor_id = auth.uid()) OR has_role(auth.uid(), 'admin'::text)))
with check (((assigned_editor_id = auth.uid()) OR has_role(auth.uid(), 'admin'::text)));


create policy "editors_view_assigned_submissions"
on "public"."customer_submissions"
as permissive
for select
to authenticated
using (((assigned_editor_id = auth.uid()) OR has_role(auth.uid(), 'admin'::text)));


create policy "Admins have full access to dishes"
on "public"."dishes"
as permissive
for all
to authenticated
using ((is_admin() OR is_account_manager()));


create policy "Allow full access to dishes"
on "public"."dishes"
as permissive
for all
to public
using (true);


create policy "Customers can manage their own dishes"
on "public"."dishes"
as permissive
for all
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))))
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "Editors can view dishes related to their submissions"
on "public"."dishes"
as permissive
for select
to authenticated
using ((is_editor() AND (EXISTS ( SELECT 1
   FROM customer_submissions
  WHERE ((customer_submissions.original_item_id = dishes.dish_id) AND (customer_submissions.assigned_editor_id = auth.uid()))))));


create policy "Admins have full access to drinks"
on "public"."drinks"
as permissive
for all
to authenticated
using ((is_admin() OR is_account_manager()));


create policy "Allow full access to drinks"
on "public"."drinks"
as permissive
for all
to public
using (true);


create policy "Customers can manage their own drinks"
on "public"."drinks"
as permissive
for all
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))))
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "Editors can view drinks related to their submissions"
on "public"."drinks"
as permissive
for select
to authenticated
using ((is_editor() AND (EXISTS ( SELECT 1
   FROM customer_submissions
  WHERE ((customer_submissions.original_item_id = drinks.drink_id) AND (customer_submissions.assigned_editor_id = auth.uid()))))));


create policy "Admins have full access to leads"
on "public"."leads"
as permissive
for all
to authenticated
using ((is_admin() OR is_account_manager()));


create policy "Anyone can create a lead"
on "public"."leads"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Clients can insert messages for their submissions"
on "public"."messages"
as permissive
for insert
to public
with check (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM customer_submissions
  WHERE ((customer_submissions.submission_id = messages.submission_id) AND (customer_submissions.client_id = auth.uid())))) AND (sender_type = 'client'::text) AND (sender_id = auth.uid())));


create policy "Clients can update read_status for messages related to their su"
on "public"."messages"
as permissive
for update
to public
using (((EXISTS ( SELECT 1
   FROM customer_submissions
  WHERE ((customer_submissions.submission_id = messages.submission_id) AND (customer_submissions.client_id = auth.uid())))) AND (sender_type = 'team'::text)))
with check ((sender_type = 'team'::text));


create policy "Clients can view messages related to their submissions"
on "public"."messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM customer_submissions
  WHERE ((customer_submissions.submission_id = messages.submission_id) AND (customer_submissions.client_id = auth.uid())))));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can manage all service packages"
on "public"."service_packages"
as permissive
for all
to public
using ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text))
with check ((((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text));


create policy "Admins can manage packages"
on "public"."service_packages"
as permissive
for all
to authenticated
using (is_admin());


create policy "Allow public read access to active service packages"
on "public"."service_packages"
as permissive
for select
to public
using ((is_active = true));


create policy "Anyone can view active packages"
on "public"."service_packages"
as permissive
for select
to anon, authenticated
using ((is_active = true));


create policy "Customers can view service packages"
on "public"."service_packages"
as permissive
for select
to authenticated
using (true);


create policy "Service role can manage all service packages"
on "public"."service_packages"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Service_Role_Full_Access"
on "public"."user_roles"
as permissive
for all
to service_role
using (true);


create policy "Simple_Read_Own_Role"
on "public"."user_roles"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Admins can manage visual styles"
on "public"."visual_styles"
as permissive
for all
to authenticated
using (is_admin());


create policy "Allow full access to visual_styles"
on "public"."visual_styles"
as permissive
for all
to public
using (true);


create policy "Anyone can view visual styles"
on "public"."visual_styles"
as permissive
for select
to anon, authenticated
using (true);


create policy "customers_create_submissions"
on "public"."customer_submissions"
as permissive
for insert
to authenticated
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "customers_update_submissions"
on "public"."customer_submissions"
as permissive
for update
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))))
with check ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


create policy "customers_view_own_submissions"
on "public"."customer_submissions"
as permissive
for select
to authenticated
using ((client_id IN ( SELECT clients.client_id
   FROM clients
  WHERE (clients.user_auth_id = auth.uid()))));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.client_packages FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_client_activity BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_client_activity_timestamp();

CREATE TRIGGER tr_decrement_servings_after_submission AFTER INSERT ON public.customer_submissions FOR EACH ROW EXECUTE FUNCTION decrement_client_servings();

CREATE TRIGGER update_lead_last_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_lead_modified_column();

CREATE TRIGGER update_packages_timestamp BEFORE UPDATE ON public.service_packages FOR EACH ROW EXECUTE FUNCTION update_package_timestamp();


