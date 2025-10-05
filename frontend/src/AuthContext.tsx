import React, { createContext, useState } from 'react'
import axios from 'axios'

interface AuthContextType {
  token: string | null
  login: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {
    throw new Error('login function must be implemented by AuthProvider')
  }
})

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const login = async (email: string, password: string) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    setToken(data.token)
    localStorage.setItem('token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
  }

  return (
    <AuthContext.Provider value={{ token, login }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
