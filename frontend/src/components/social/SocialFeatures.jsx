import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { fmt, fmtDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

// ── Share Order ───────────────────────────────────────────────────────────────
export function ShareOrder({ order }) {
  const [show, setShow] = useState(false)

  const shareText = `🔥 Just ordered from QuickBite!\n${order.items.map(i => `${i.emoji} ${i.name}`).join('\n')}\nTotal: ${fmt(order.total)}\n\nOrder yours at quickbite.app`

  const share = async (platform) => {
    if (platform === 'native' && navigator.share) {
      await navigator.share({ title: 'My QuickBite Order', text: shareText, url: window.location.href })
      toast.success('Shared!')
      return
    }
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      copy:     null,
    }
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareText)
      toast.success('📋 Copied to clipboard!')
    } else {
      window.open(urls[platform], '_blank')
      toast.success('Opening...')
    }
    setShow(false)
  }

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button onClick={() => setShow(p => !p)} className="btn-ghost" style={{ padding:'9px 18px', fontSize:13 }}>
        📤 Share Order
      </button>
      {show && (
        <>
          <div onClick={() => setShow(false)} style={{ position:'fixed', inset:0, zIndex:48 }} />
          <div className="anim-scale-in" style={{ position:'absolute', bottom:'calc(100% + 8px)', right:0, background:'var(--ink-2)', border:'1px solid var(--border-2)', borderRadius:'var(--r-lg)', padding:12, zIndex:49, minWidth:200, boxShadow:'var(--shadow-lg)' }}>
            {[
              { icon:'📱', label:'Share via...', key:'native' },
              { icon:'💬', label:'WhatsApp',     key:'whatsapp' },
              { icon:'🐦', label:'Twitter/X',    key:'twitter' },
              { icon:'📋', label:'Copy text',    key:'copy' },
            ].map(s => (
              <button key={s.key} onClick={() => share(s.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'none', background:'transparent', color:'var(--chalk)', cursor:'pointer', fontSize:13, fontFamily:'Cabinet Grotesk, sans-serif', fontWeight:500, textAlign:'left', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--ink-3)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <span style={{ fontSize:18 }}>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Referral System ───────────────────────────────────────────────────────────
export function ReferralCard() {
  const { referralCode, addPoints } = useApp()
  const [inputCode, setInputCode]   = useState('')
  const [redeemed, setRedeemed]     = useState(() => localStorage.getItem('qb_ref_redeemed') === 'true')
  const referralLink = `https://quickbite.app/ref/${referralCode}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink)
    toast.success('📋 Referral link copied!')
  }

  const redeemCode = () => {
    if (!inputCode.trim()) { toast.error('Enter a referral code'); return }
    if (redeemed) { toast.error('You already used a referral code'); return }
    if (inputCode.toUpperCase() === referralCode) { toast.error("Can't use your own code 😄"); return }
    if (inputCode.toUpperCase().startsWith('QB')) {
      addPoints(200)
      setRedeemed(true)
      localStorage.setItem('qb_ref_redeemed', 'true')
      toast.success('🎉 Referral code applied! +200 points!')
    } else {
      toast.error('Invalid referral code')
    }
  }

  return (
    <div className="section-card">
      <h3 style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>👥 Refer & Earn</h3>
      <p style={{ color:'var(--mist)', fontSize:13, marginBottom:20 }}>Share your code and earn 200 points when friends order</p>

      {/* Your code */}
      <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(251,191,36,0.1))', border:'1px solid rgba(249,115,22,0.25)', borderRadius:'var(--r-lg)', padding:'20px 24px', marginBottom:20, textAlign:'center' }}>
        <p style={{ color:'var(--mist)', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Your Referral Code</p>
        <div style={{ fontFamily:'Fraunces, serif', fontSize:32, fontWeight:900, color:'var(--brand)', letterSpacing:'0.1em', marginBottom:12 }}>{referralCode}</div>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button onClick={copyLink} className="btn-primary" style={{ padding:'9px 18px', fontSize:13 }}>📋 Copy Link</button>
          <button onClick={() => { if (navigator.share) navigator.share({ title:'Join QuickBite!', text:`Use my code ${referralCode} for 200 points!`, url:referralLink }) }} className="btn-ghost" style={{ padding:'9px 18px', fontSize:13 }}>📤 Share</button>
        </div>
      </div>

      {/* Redeem a code */}
      {!redeemed && (
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'var(--mist)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Have a Friend's Code?</p>
          <div style={{ display:'flex', gap:0 }}>
            <input className="input" style={{ borderRadius:'var(--r-md) 0 0 var(--r-md)', borderRight:'none', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.1em' }}
              placeholder="Enter code e.g. QB4X7K" value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} />
            <button className="btn-primary" onClick={redeemCode} style={{ borderRadius:'0 var(--r-md) var(--r-md) 0', padding:'0 18px', flexShrink:0, fontSize:14 }}>Apply</button>
          </div>
        </div>
      )}
      {redeemed && (
        <div style={{ padding:'12px 16px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'var(--r-md)', color:'var(--success)', fontSize:13, fontWeight:600 }}>
          ✅ Referral code already redeemed! +200 points earned
        </div>
      )}
    </div>
  )
}

// ── Reviews Feed ──────────────────────────────────────────────────────────────
const MOCK_REVIEWS = [
  { user:'Priya S.',    avatar:'👩', item:'Spicy Dragon Burger 🍔', rating:5, comment:'Absolutely amazing! The ghost pepper sauce is 🔥', time:'2 min ago',  likes:12 },
  { user:'Rahul M.',    avatar:'👨', item:'Wagyu Ramen 🍜',         rating:5, comment:'Best ramen I have ever had. The broth is incredible!', time:'15 min ago', likes:8  },
  { user:'Ananya K.',   avatar:'👩', item:'Truffle Margherita 🍕',  rating:4, comment:'Crispy crust, fresh basil. Will order again!', time:'1 hr ago',  likes:5  },
  { user:'Vikram P.',   avatar:'🧔', item:'Lobster Tacos 🌮',       rating:5, comment:'Premium quality. Worth every penny!', time:'2 hr ago',  likes:20 },
  { user:'Sneha R.',    avatar:'👧', item:'Acai Power Bowl 🥣',     rating:4, comment:'Healthy and delicious. Perfect for lunch!', time:'3 hr ago',  likes:7  },
  { user:'Arjun T.',    avatar:'👦', item:'Korean Chicken 🍗',      rating:5, comment:'Double fried perfection. Gochujang glaze is 😍', time:'4 hr ago',  likes:15 },
]

export function ReviewsFeed() {
  const [likes, setLikes] = useState({})

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <span style={{ fontSize:20 }}>💬</span>
        <h3 style={{ fontSize:18, fontWeight:800 }}>What People Are Ordering</h3>
        <span style={{ fontSize:11, color:'var(--success)', background:'rgba(34,197,94,0.1)', padding:'3px 10px', borderRadius:99, fontWeight:700 }}>● Live</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {MOCK_REVIEWS.map((r, i) => (
          <div key={i} style={{ background:'var(--ink-2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'16px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--brand),#fbbf24)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{r.avatar}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <p style={{ fontWeight:700, fontSize:14 }}>{r.user}</p>
                  <p style={{ color:'var(--mist)', fontSize:11 }}>{r.time}</p>
                </div>
                <p style={{ color:'var(--mist)', fontSize:12 }}>Ordered: {r.item}</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:2, marginBottom:8 }}>
              {Array.from({length:5}).map((_,j) => <span key={j} style={{ fontSize:14, filter:j<r.rating?'none':'grayscale(1) opacity(0.3)' }}>⭐</span>)}
            </div>
            <p style={{ fontSize:14, color:'var(--chalk)', lineHeight:1.5, marginBottom:10 }}>"{r.comment}"</p>
            <button onClick={() => setLikes(l => ({...l,[i]:(l[i]||r.likes)+1}))} style={{ background:'none', border:'none', color:'var(--mist)', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, fontFamily:'Cabinet Grotesk, sans-serif' }}>
              👍 {likes[i] || r.likes} likes
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Group Ordering ────────────────────────────────────────────────────────────
export function GroupOrderBanner() {
  const [show, setShow]   = useState(false)
  const [link, setLink]   = useState('')
  const [joined, setJoined] = useState(false)

  const createGroup = () => {
    const code = Math.random().toString(36).substr(2,8).toUpperCase()
    const groupLink = `${window.location.origin}/?group=${code}`
    setLink(groupLink)
    setShow(true)
  }

  return (
    <>
      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.1))', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'var(--r-lg)', padding:'16px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:800, fontSize:15, marginBottom:3 }}>👥 Group Ordering</p>
          <p style={{ color:'var(--mist)', fontSize:13 }}>Order together with friends. Everyone adds their items, one checkout!</p>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={createGroup} className="btn-primary" style={{ padding:'9px 16px', fontSize:13, background:'#3b82f6' }}>
            + Create Group
          </button>
          <button onClick={() => toast('Enter the group link from your friend to join!')} className="btn-ghost" style={{ padding:'9px 16px', fontSize:13 }}>
            Join Group
          </button>
        </div>
      </div>

      {show && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShow(false)}>
          <div className="anim-scale-in" style={{ background:'var(--ink-2)', border:'1px solid var(--border-2)', borderRadius:'var(--r-xl)', padding:'36px 32px', maxWidth:440, width:'100%' }}>
            <h3 style={{ fontFamily:'Fraunces, serif', fontSize:22, fontWeight:900, marginBottom:6 }}>👥 Group Order Created!</h3>
            <p style={{ color:'var(--mist)', fontSize:13, marginBottom:20 }}>Share this link with friends. Everyone can add items to the cart.</p>
            <div style={{ background:'var(--ink-3)', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:16, fontFamily:'monospace', fontSize:12, color:'var(--chalk)', wordBreak:'break-all' }}>{link}</div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={async () => { await navigator.clipboard.writeText(link); toast.success('📋 Link copied!') }} className="btn-primary" style={{ flex:1, padding:'12px' }}>📋 Copy Link</button>
              <button onClick={() => setShow(false)} className="btn-ghost" style={{ flex:1, padding:'12px' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
