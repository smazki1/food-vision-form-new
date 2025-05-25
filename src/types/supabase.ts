export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          package_name: string
          remaining_dishes: number
          total_dishes: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          package_name: string
          remaining_dishes: number
          total_dishes: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          package_name?: string
          remaining_dishes?: number
          total_dishes?: number
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
  }
}
