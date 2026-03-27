import React, { useEffect, useRef } from 'react'

export default function Confetti({ active, onDone }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const COLORS = ['#f97316','#fbbf24','#22c55e','#3b82f6','#a855f7','#ec4899','#ef4444','#ffffff']
    const pieces = Array.from({ length: 180 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height - canvas.height,
      w:     Math.random() * 12 + 6,
      h:     Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot:   Math.random() * Math.PI * 2,
      vx:    (Math.random() - 0.5) * 4,
      vy:    Math.random() * 5 + 3,
      vr:    (Math.random() - 0.5) * 0.2,
      alpha: 1,
    }))

    let frame = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.x  += p.vx
        p.y  += p.vy
        p.rot += p.vr
        p.vy += 0.12
        if (frame > 120) p.alpha = Math.max(0, p.alpha - 0.012)
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      frame++
      if (frame < 220) animRef.current = requestAnimationFrame(draw)
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); onDone?.() }
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [active, onDone])

  if (!active) return null
  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      zIndex: 9999, width: '100%', height: '100%',
    }} />
  )
}
