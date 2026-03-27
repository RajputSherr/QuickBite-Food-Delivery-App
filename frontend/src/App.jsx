import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { AppProvider } from './context/AppContext'
import Navbar from './components/shared/Navbar'
import CartDrawer from './components/cart/CartDrawer'
import AuthModal from './components/auth/AuthModal'
import ScrollToTop from './components/ui/ScrollToTop'
import { SplashScreen, OnboardingScreens } from './components/onboarding'
import { NotFoundPage } from './components/ui/EmptyStates'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProfilePage from './pages/profile/ProfilePage'
import { HomePage, CheckoutPage, OrdersPage, OrderDetailPage } from './pages'

function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}><div style={{ width:40, height:40, border:'3px solid var(--ink-4)', borderTop:'3px solid var(--brand)', borderRadius:'50%', animation:'spin 0.75s linear infinite' }} /></div>
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <AdminDashboard />
}

function AppShell() {
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const openAuth = (mode = 'login') => { setAuthMode(mode); setAuthOpen(true) }

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} onAuthOpen={openAuth} />
      <main>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/checkout"   element={<CheckoutPage />} />
          <Route path="/orders"     element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile"    element={<ProfilePage />} />
          <Route path="*"           element={<NotFoundPage />} />
        </Routes>
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onAuthNeeded={() => openAuth('login')} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
      <ScrollToTop />
    </>
  )
}

export default function App() {
  const [showSplash,     setShowSplash]     = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('qb_onboarded')
    if (!seen) {
      // Will show onboarding after splash
    }
  }, [])

  const handleSplashDone = () => {
    setShowSplash(false)
    const seen = localStorage.getItem('qb_onboarded')
    if (!seen) setShowOnboarding(true)
  }

  const handleOnboardingDone = () => {
    localStorage.setItem('qb_onboarded', 'true')
    setShowOnboarding(false)
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <CartProvider>
            {/* Splash screen */}
            {showSplash && <SplashScreen onDone={handleSplashDone} />}

            {/* Onboarding (first time only) */}
            {!showSplash && showOnboarding && <OnboardingScreens onDone={handleOnboardingDone} />}

            {/* Main app */}
            {!showSplash && !showOnboarding && (
              <Routes>
                <Route path="/admin" element={<AdminRoute />} />
                <Route path="/*"    element={<AppShell />} />
              </Routes>
            )}

            <Toaster
              position="bottom-center"
              toastOptions={{
                style:{ background:'var(--ink-3)', color:'var(--chalk)', border:'1px solid var(--border-2)', borderRadius:'99px', fontFamily:'Cabinet Grotesk, sans-serif', fontSize:'14px', fontWeight:'600', padding:'12px 20px' },
                success:{ iconTheme:{ primary:'#f97316', secondary:'#fff' } },
                duration: 2500,
              }}
            />
          </CartProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
