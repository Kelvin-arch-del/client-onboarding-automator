import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LoginPage from './pages/LoginPage'
import ClientsPage from './pages/ClientsPage'

const App: React.FC = () => {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/clients" element={token ? <ClientsPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={token ? '/clients' : '/login'} />} />
    </Routes>
  )
}

export default App

