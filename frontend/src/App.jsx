import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/ToastProvider'
import { PricingModalProvider } from './components/PricingModal'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Success from './pages/Success'
import Cancel from './pages/Cancel'

function RequireAuth({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return children
}

function PublicOnly({ children }) {
  const token = localStorage.getItem('token')

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <ToastProvider>
      <PricingModalProvider>
        <BrowserRouter>
        <Routes>

          {/* LOGIN sin layout */}
          <Route path="/" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          {/* CON layout */}
          <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
          <Route path="/products" element={<RequireAuth><Layout><Products /></Layout></RequireAuth>} />
          <Route path="/sales" element={<RequireAuth><Layout><Sales /></Layout></RequireAuth>} />

          {/* Páginas de pago */}
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />

        </Routes>
      </BrowserRouter>      </PricingModalProvider>    </ToastProvider>
  )
}

export default App