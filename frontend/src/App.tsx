import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { RegisterService } from './pages/RegisterService'
import { RegisterUser } from './pages/RegisterUser'
import { PublicStatus } from './pages/PublicStatus'

import React from 'react'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<RegisterUser />} />
        <Route path="/status/:userId" element={<PublicStatus />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/register-service" element={
            <PrivateRoute><RegisterService /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

