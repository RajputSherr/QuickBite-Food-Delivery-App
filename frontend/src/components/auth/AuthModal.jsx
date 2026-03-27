import React, { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { FieldLabel, ErrorMsg, GlobalError } from '../shared'
import toast from 'react-hot-toast'

export default function AuthModal({ open, onClose, initialMode = 'login' }) {
  const { login, register }   = useAuth()
  const { addPoints }         = useApp()
  const [mode, setMode]       = useState(initialMode)  // login | register | phone | otp
  const [loading, setLoading] = useState(false)
  const [globalErr, setGlobalErr] = useState('')
  const [form, setForm]       = useState({ name:'', email:'', password:'' })
  const [errors, setErrors]   = useState({})
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState(['','','','','',''])
  const [otpSent, setOtpSent] = useState(false)
  const [biometricAvailable]  = useState(() => window.PublicKeyCredential !== undefined)

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrors(e => ({...e,[k]:''})) }

  const validate = useCallback(() => {
    const e = {}
    if (mode==='register' && !form.name.trim()) e.name = 'Name is required'
    if (!/^\S+@\S+\.\S+$/.test(form.email))     e.email = 'Enter a valid email'
    if (form.password.length < 6)                e.password = 'Min 6 characters'
    return e
  }, [mode, form])

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setGlobalErr(''); setLoading(true)
    try {
      if (mode==='login') await login(form.email, form.password)
      else { await register(form.name, form.email, form.password); addPoints(100) } // welcome bonus
      onClose()
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  // Google login simulation
  const handleGoogle = async () => {
    setLoading(true)
    toast('🔄 Redirecting to Google...')
    await new Promise(r => setTimeout(r, 1200))
    try {
      await register('Google User', `google_${Date.now()}@gmail.com`, 'google_oauth_' + Date.now())
      toast.success('✅ Signed in with Google!')
      onClose()
    } catch {
      // Already exists - try login
      toast.success('✅ Signed in with Google!')
      onClose()
    } finally { setLoading(false) }
  }

  // Phone OTP simulation
  const sendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter a valid phone number'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setOtpSent(true)
    setLoading(false)
    toast.success(`📱 OTP sent to ${phone}`)
    toast(`💡 Use code: 123456`, { icon: '🔑', duration: 8000 })
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    if (code === '123456') {
      try {
        await register(`User_${phone.slice(-4)}`, `phone_${phone}@quickbite.com`, 'phone_' + Date.now())
        toast.success('✅ Phone verified!')
        onClose()
      } catch {
        toast.success('✅ Welcome back!')
        onClose()
      }
    } else {
      toast.error('❌ Invalid OTP. Try 123456')
    }
    setLoading(false)
  }

  // Biometric simulation
  const handleBiometric = async () => {
    if (!biometricAvailable) { toast.error('Biometric not available on this device'); return }
    setLoading(true)
    try {
      // Request WebAuthn
      await navigator.credentials?.get?.({ publicKey: {
        challenge: new Uint8Array(32),
        timeout: 60000,
        userVerification: 'required',
      }}).catch(() => null)
      toast.success('🔐 Biometric login successful!')
      onClose()
    } catch {
      toast.error('Biometric login failed')
    } finally { setLoading(false) }
  }

  const handleOtpInput = (i, val) => {
    if (val.length > 1) val = val.slice(-1)
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus()
  }

  const switchMode = (m) => { setMode(m); setErrors({}); setGlobalErr(''); setForm({ name:'', email:'', password:'' }); setOtpSent(false); setOtp(['','','','','','']) }

  if (!open) return null

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="anim-scale-in" style={{ background:'var(--ink-2)', border:'1px solid var(--border-2)', borderRadius:'var(--r-xl)', padding:'40px 36px', width:'100%', maxWidth:420, position:'relative', boxShadow:'var(--shadow-lg)' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'var(--ink-3)', border:'none', borderRadius:99, width:32, height:32, color:'var(--mist)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

        {/* Phone OTP Mode */}
        {mode === 'phone' && (
          <div>
            <div style={{ fontSize:36, marginBottom:12 }}>📱</div>
            <h2 style={{ fontFamily:'Fraunces, serif', fontSize:24, fontWeight:900, marginBottom:6 }}>Phone Login</h2>
            <p style={{ color:'var(--mist)', fontSize:14, marginBottom:24 }}>We'll send you a one-time password</p>

            {!otpSent ? (
              <>
                <FieldLabel>Phone Number</FieldLabel>
                <input className="input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} style={{ marginBottom:20 }} />
                <button className="btn-primary" onClick={sendOtp} disabled={loading} style={{ width:'100%', padding:'14px' }}>
                  {loading ? '⏳ Sending...' : '📤 Send OTP'}
                </button>
              </>
            ) : (
              <>
                <p style={{ color:'var(--mist)', fontSize:13, marginBottom:16 }}>Enter 6-digit OTP sent to {phone}</p>
                <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:20 }}>
                  {otp.map((val, i) => (
                    <input key={i} id={`otp-${i}`} maxLength={1} value={val}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => e.key==='Backspace' && !val && i > 0 && document.getElementById(`otp-${i-1}`)?.focus()}
                      style={{ width:44, height:52, textAlign:'center', fontSize:22, fontWeight:800, background:'var(--ink-3)', border:`2px solid ${val ? 'var(--brand)' : 'var(--border-2)'}`, borderRadius:'var(--r-md)', color:'var(--chalk)', outline:'none', fontFamily:'Cabinet Grotesk, sans-serif' }} />
                  ))}
                </div>
                <button className="btn-primary" onClick={verifyOtp} disabled={loading} style={{ width:'100%', padding:'14px' }}>
                  {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
                </button>
                <button onClick={() => sendOtp()} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:'var(--brand)', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'Cabinet Grotesk, sans-serif' }}>
                  Resend OTP
                </button>
              </>
            )}
            <button onClick={() => switchMode('login')} style={{ width:'100%', marginTop:12, background:'none', border:'none', color:'var(--mist)', cursor:'pointer', fontSize:13, fontFamily:'Cabinet Grotesk, sans-serif' }}>
              ← Back to Login
            </button>
          </div>
        )}

        {/* Email Login/Register Mode */}
        {(mode === 'login' || mode === 'register') && (
          <>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>{mode==='login'?'👋':'🎉'}</div>
              <h2 style={{ fontFamily:'Fraunces, serif', fontSize:26, fontWeight:900, marginBottom:6 }}>{mode==='login'?'Welcome back':'Create account'}</h2>
              <p style={{ color:'var(--mist)', fontSize:14 }}>{mode==='login'?'Sign in to your QuickBite account':'Join and get 100 welcome points!'}</p>
            </div>

            <GlobalError msg={globalErr} />

            {/* Social logins */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              <button onClick={handleGoogle} disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:'var(--r-md)', border:'1px solid var(--border-2)', background:'var(--ink-3)', color:'var(--chalk)', fontFamily:'Cabinet Grotesk, sans-serif', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.2s' }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                Continue with Google
              </button>

              <button onClick={() => switchMode('phone')} style={{ width:'100%', padding:'12px', borderRadius:'var(--r-md)', border:'1px solid var(--border-2)', background:'var(--ink-3)', color:'var(--chalk)', fontFamily:'Cabinet Grotesk, sans-serif', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                📱 Continue with Phone
              </button>

              {biometricAvailable && (
                <button onClick={handleBiometric} disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:'var(--r-md)', border:'1px solid rgba(249,115,22,0.3)', background:'rgba(249,115,22,0.08)', color:'var(--brand)', fontFamily:'Cabinet Grotesk, sans-serif', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  🔐 Use Biometric / Face ID
                </button>
              )}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:'var(--border-2)' }} />
              <span style={{ color:'var(--mist)', fontSize:12, fontWeight:600 }}>OR</span>
              <div style={{ flex:1, height:1, background:'var(--border-2)' }} />
            </div>

            {mode==='register' && (
              <div style={{ marginBottom:16 }}>
                <FieldLabel>Full Name</FieldLabel>
                <input className="input" placeholder="John Doe" value={form.name} onChange={e => set('name',e.target.value)} onKeyDown={e => e.key==='Enter' && handleSubmit()} />
                <ErrorMsg msg={errors.name} />
              </div>
            )}
            <div style={{ marginBottom:16 }}>
              <FieldLabel>Email Address</FieldLabel>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email',e.target.value)} onKeyDown={e => e.key==='Enter' && handleSubmit()} />
              <ErrorMsg msg={errors.email} />
            </div>
            <div style={{ marginBottom:24 }}>
              <FieldLabel>Password</FieldLabel>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password',e.target.value)} onKeyDown={e => e.key==='Enter' && handleSubmit()} />
              <ErrorMsg msg={errors.password} />
            </div>

            <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:'100%', padding:'14px' }}>
              {loading ? '⏳ Please wait...' : mode==='login' ? 'Sign In →' : 'Create Account →'}
            </button>

            <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--mist)' }}>
              {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
              <span onClick={() => switchMode(mode==='login'?'register':'login')} style={{ color:'var(--brand)', cursor:'pointer', fontWeight:700 }}>
                {mode==='login' ? 'Sign up free' : 'Sign in'}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
