/**
 * Supabase Database type definitions.
 * Follows the Supabase generated types pattern with Tables, Row, Insert, Update helpers.
 */

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
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          role: 'admin' | 'salesperson'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          role?: 'admin' | 'salesperson'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          role?: 'admin' | 'salesperson'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          id: string
          brand: string
          model: string
          sub_model: string | null
          unit_condition: 'Brand New' | 'Re-certified' | 'Demo Unit'
          letterhead: 'ES Print Media Inc.' | 'ACS / Alternative'
          image_key: string | null
          has_computer_set_option: boolean
          warranty_machine_duration: string | null
          warranty_printhead_duration: string | null
          srp: number
          lbp: number
          cash_price: number
          machine_warranty_months: number
          printhead_warranty: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          sub_model?: string | null
          unit_condition: 'Brand New' | 'Re-certified' | 'Demo Unit'
          letterhead?: 'ES Print Media Inc.' | 'ACS / Alternative'
          image_key?: string | null
          has_computer_set_option?: boolean
          warranty_machine_duration?: string | null
          warranty_printhead_duration?: string | null
          srp?: number
          lbp?: number
          cash_price?: number
          machine_warranty_months?: number
          printhead_warranty?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          sub_model?: string | null
          unit_condition?: 'Brand New' | 'Re-certified' | 'Demo Unit'
          letterhead?: 'ES Print Media Inc.' | 'ACS / Alternative'
          image_key?: string | null
          has_computer_set_option?: boolean
          warranty_machine_duration?: string | null
          warranty_printhead_duration?: string | null
          srp?: number
          lbp?: number
          cash_price?: number
          machine_warranty_months?: number
          printhead_warranty?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      machine_features: {
        Row: {
          id: string
          machine_id: string
          description: string
          sort_order: number
        }
        Insert: {
          id?: string
          machine_id: string
          description: string
          sort_order?: number
        }
        Update: {
          id?: string
          machine_id?: string
          description?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'machine_features_machine_id_fkey'
            columns: ['machine_id']
            referencedRelation: 'machines'
            referencedColumns: ['id']
          }
        ]
      }
      machine_consumables: {
        Row: {
          id: string
          machine_id: string
          item_name: string
          package_description: string | null
          default_price: number
          sort_order: number
        }
        Insert: {
          id?: string
          machine_id: string
          item_name: string
          package_description?: string | null
          default_price: number
          sort_order?: number
        }
        Update: {
          id?: string
          machine_id?: string
          item_name?: string
          package_description?: string | null
          default_price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'machine_consumables_machine_id_fkey'
            columns: ['machine_id']
            referencedRelation: 'machines'
            referencedColumns: ['id']
          }
        ]
      }
      machine_inclusions: {
        Row: {
          id: string
          machine_id: string
          description: string
          sort_order: number
        }
        Insert: {
          id?: string
          machine_id: string
          description: string
          sort_order?: number
        }
        Update: {
          id?: string
          machine_id?: string
          description?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'machine_inclusions_machine_id_fkey'
            columns: ['machine_id']
            referencedRelation: 'machines'
            referencedColumns: ['id']
          }
        ]
      }
      machine_exclusions: {
        Row: {
          id: string
          machine_id: string
          description: string
          sort_order: number
        }
        Insert: {
          id?: string
          machine_id: string
          description: string
          sort_order?: number
        }
        Update: {
          id?: string
          machine_id?: string
          description?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'machine_exclusions_machine_id_fkey'
            columns: ['machine_id']
            referencedRelation: 'machines'
            referencedColumns: ['id']
          }
        ]
      }
      machine_addons: {
        Row: {
          id: string
          machine_id: string
          description: string
          sort_order: number
        }
        Insert: {
          id?: string
          machine_id: string
          description: string
          sort_order?: number
        }
        Update: {
          id?: string
          machine_id?: string
          description?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'machine_addons_machine_id_fkey'
            columns: ['machine_id']
            referencedRelation: 'machines'
            referencedColumns: ['id']
          }
        ]
      }
      product_info_links: {
        Row: {
          id: string
          machine_id: string
          display_name: string
          url: string
          document_type: string
          created_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          display_name: string
          url: string
          document_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          display_name?: string
          url?: string
          document_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_info_links_machine_id_fkey'
            columns: ['machine_id']
            referencedRelation: 'machines'
            referencedColumns: ['id']
          }
        ]
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          machine_id: string | null
          client_name: string | null
          company: string | null
          address: string | null
          contact: string | null
          deal_type: 'Standard Cash' | 'Standard Terms' | 'Trade-In Cash' | 'Trade-In Terms' | null
          contract_price: number | null
          vat_inclusive: boolean
          under_promo: boolean
          promo_validity: string | null
          availability: string | null
          collection_payment: string | null
          collection_downpayment: string | null
          collection_amortization: string | null
          ae_name: string | null
          client_conforme: string | null
          noted_by_name: string | null
          noted_by_role: string | null
          letterhead: string | null
          freebies: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          machine_id?: string | null
          client_name?: string | null
          company?: string | null
          address?: string | null
          contact?: string | null
          deal_type?: 'Standard Cash' | 'Standard Terms' | 'Trade-In Cash' | 'Trade-In Terms' | null
          contract_price?: number | null
          vat_inclusive?: boolean
          under_promo?: boolean
          promo_validity?: string | null
          availability?: string | null
          collection_payment?: string | null
          collection_downpayment?: string | null
          collection_amortization?: string | null
          ae_name?: string | null
          client_conforme?: string | null
          noted_by_name?: string | null
          noted_by_role?: string | null
          letterhead?: string | null
          freebies?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          machine_id?: string | null
          client_name?: string | null
          company?: string | null
          address?: string | null
          contact?: string | null
          deal_type?: 'Standard Cash' | 'Standard Terms' | 'Trade-In Cash' | 'Trade-In Terms' | null
          contract_price?: number | null
          vat_inclusive?: boolean
          under_promo?: boolean
          promo_validity?: string | null
          availability?: string | null
          collection_payment?: string | null
          collection_downpayment?: string | null
          collection_amortization?: string | null
          ae_name?: string | null
          client_conforme?: string | null
          noted_by_name?: string | null
          noted_by_role?: string | null
          letterhead?: string | null
          freebies?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quotes_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quotes_machine_id_fkey'
            columns: ['machine_id']
            referencedRelation: 'machines'
            referencedColumns: ['id']
          }
        ]
      }
      quote_term_options: {
        Row: {
          id: string
          quote_id: string
          down_payment: number
          months: number
          monthly_amortization: number | null
          sort_order: number
        }
        Insert: {
          id?: string
          quote_id: string
          down_payment?: number
          months: number
          monthly_amortization?: number | null
          sort_order?: number
        }
        Update: {
          id?: string
          quote_id?: string
          down_payment?: number
          months?: number
          monthly_amortization?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'quote_term_options_quote_id_fkey'
            columns: ['quote_id']
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          }
        ]
      }
      quote_trade_ins: {
        Row: {
          id: string
          quote_id: string
          description: string
          value: number
          sort_order: number
        }
        Insert: {
          id?: string
          quote_id: string
          description: string
          value: number
          sort_order?: number
        }
        Update: {
          id?: string
          quote_id?: string
          description?: string
          value?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'quote_trade_ins_quote_id_fkey'
            columns: ['quote_id']
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          }
        ]
      }
      quote_consumable_prices: {
        Row: {
          id: string
          quote_id: string
          consumable_id: string
          custom_price: number
        }
        Insert: {
          id?: string
          quote_id: string
          consumable_id: string
          custom_price: number
        }
        Update: {
          id?: string
          quote_id?: string
          consumable_id?: string
          custom_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'quote_consumable_prices_quote_id_fkey'
            columns: ['quote_id']
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quote_consumable_prices_consumable_id_fkey'
            columns: ['consumable_id']
            referencedRelation: 'machine_consumables'
            referencedColumns: ['id']
          }
        ]
      }
      migration_status: {
        Row: {
          id: string
          migrated_by: string
          records_found: number
          records_migrated: number
          records_skipped: number
          skipped_details: Json
          status: 'in_progress' | 'completed' | 'failed'
          error_message: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          migrated_by: string
          records_found?: number
          records_migrated?: number
          records_skipped?: number
          skipped_details?: Json
          status: 'in_progress' | 'completed' | 'failed'
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          migrated_by?: string
          records_found?: number
          records_migrated?: number
          records_skipped?: number
          skipped_details?: Json
          status?: 'in_progress' | 'completed' | 'failed'
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'migration_status_migrated_by_fkey'
            columns: ['migrated_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/** Helper type: extract the Row type from a table name */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/** Helper type: extract the Insert type from a table name */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/** Helper type: extract the Update type from a table name */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
