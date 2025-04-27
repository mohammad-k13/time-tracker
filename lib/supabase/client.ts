"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Create a single instance that can be reused
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient()
  }
  return supabaseClient
}
