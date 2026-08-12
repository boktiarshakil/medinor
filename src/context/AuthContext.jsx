import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'
import { registerServiceWorker, initPush } from '../lib/push'
import { locationSharing } from '../lib/geo'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const applyProfile = (profile) => {
    if (profile && profile.is_active === false) {
      supabase.auth.signOut()
      setUser(null)
      throw new Error('This account has been deactivated. Contact an administrator.')
    }
    setUser(profile)
    return profile
  }

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await getCurrentUser()
        if (profile && profile.is_active === false) {
          await supabase.auth.signOut()
          setUser(null)
        } else {
          setUser(profile)
          // Enable web push (browser shows the permission prompt on first login)
          if (profile) {
            registerServiceWorker()
            setTimeout(() => initPush(profile), 1500)
          }
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        try {
          const profile = await getCurrentUser()
          if (profile && profile.is_active === false) {
            await supabase.auth.signOut()
            setUser(null)
          } else {
            setUser(profile)
            if (profile) {
              registerServiceWorker()
              setTimeout(() => initPush(profile), 1500)
            }
          }
        } catch (err) {
          console.error('Auth state error:', err)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        locationSharing.stop()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const profile = await getCurrentUser()
    return applyProfile(profile)
  }, [])

  const signOut = useCallback(async () => {
    locationSharing.stop()
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const profile = await getCurrentUser()
    setUser(profile)
    return profile
  }, [])

  // Role helpers
  const hasRole = useCallback((...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  const isAdmin = hasRole('super_admin', 'admin')
  const isManager = hasRole('super_admin', 'admin', 'sales_manager')
  const isAreaManager = hasRole('super_admin', 'admin', 'sales_manager', 'area_manager')
  const isSalesExec = hasRole('sales_executive')
  const isDealer = hasRole('dealer')

  const value = {
    user,
    loading,
    initialized,
    signIn,
    signOut,
    refreshUser,
    hasRole,
    isAdmin,
    isManager,
    isAreaManager,
    isSalesExec,
    isDealer,
    role: user?.role || null,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

