import { supabase } from '@/services/supabase'

/**
 * Exposes the Supabase client singleton for use in composables and components
 * that need direct access to the Supabase API.
 */
export function useSupabase() {
  return { supabase }
}
