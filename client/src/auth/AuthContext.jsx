import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(() => (localStorage.getItem('token') ? true : false))

  // Validate existing token on mount
  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session invalid')
        return res.json()
      })
      .then((data) => {
        if (isMounted) {
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
        }
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in')
    }

    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = new Headers(options.headers || {})
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      const res = await fetch(url, { ...options, headers })
      if (res.status === 401) {
        logout()
      }
      return res
    },
    [token]
  )

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}
