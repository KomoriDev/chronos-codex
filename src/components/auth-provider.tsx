"use client"

import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  fetchUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const fetchUser = useCallback(async () => {
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUser(session.user)
        setIsLoading(false)
        return
      }

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        if (error.message !== "Auth session missing!") {
          console.error("Error fetching user:", error.message)
        }
      }

      setUser(user)
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          fetchUser()
        }
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUser, supabase])

  return (
    <AuthContext.Provider value={{ user, isLoading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}
