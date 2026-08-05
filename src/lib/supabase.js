import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try to get existing profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile) return profile

  // No profile exists — create one (handles existing auth users)
  const { data: newProfile, error } = await supabase
    .from('user_profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      phone: user.user_metadata?.phone || null,
      role: user.user_metadata?.role || 'sales_executive',
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.warn('Auto-profile creation failed:', error.message)
    // Return minimal profile so app doesn't break
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email || 'User',
      role: user.user_metadata?.role || 'sales_executive',
      is_active: true
    }
  }

  return newProfile
}

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager',
  AREA_MANAGER: 'area_manager',
  SALES_EXECUTIVE: 'sales_executive',
  WAREHOUSE: 'warehouse',
  DEALER: 'dealer',
}
