
import { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "editor" | "account_manager";

export interface UserWithRole extends User {
  role?: UserRole;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}
