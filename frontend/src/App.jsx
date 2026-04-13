import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/ToastProvider'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Success from './pages/Success'
import Cancel from './pages/Cancel'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>

          {/* LOGIN sin layout */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* CON layout */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />

          {/* Páginas de pago */}
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App