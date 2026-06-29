import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, getAccessToken, setTokens, clearTokens, ApiError } from './api'
import type { Tone } from './theme'

export interface AdminUser {
  id: string
  name: string
  email: string
  tone: Tone
  role: string
  initials: string
}

function toUser(raw: any): AdminUser {
  const name: string = raw?.name ?? 'Admin'
  const initials =
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('') || 'A'
  return { id: raw.id, name, email: raw.email, tone: (raw.tone as Tone) ?? 'indigo', role: raw.role ?? 'customer', initials }
}

interface AuthContextValue {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!getAccessToken()) { setLoading(false); return }
      try {
        const me = await api.me()
        if (active) {
          const u = toUser(me)
          if (u.role === 'admin') setUser(u)
          else clearTokens()
        }
      } catch {
        if (active) clearTokens()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function login(email: string, password: string) {
    const res = await api.login({ email, password })
    const u = toUser(res.user)
    if (u.role !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Tài khoản này không có quyền quản trị.')
    }
    setTokens(res.accessToken, res.refreshToken)
    setUser(u)
  }

  async function logout() {
    try { await api.logout() } catch { /* ignore */ }
    clearTokens()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>')
  return ctx
}

/** Bảo vệ route admin — chuyển về /login nếu chưa đăng nhập (admin). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
