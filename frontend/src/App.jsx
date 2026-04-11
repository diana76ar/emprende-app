import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/ToastProvider'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>

          {/* LOGIN sin layout */}
          <Route path="/" element={<Login />} />

          {/* CON layout */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App