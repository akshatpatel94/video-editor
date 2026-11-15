import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00.00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

function calcTimeStep(duration: number, width: number): number {
  const target = Math.max(4, Math.floor(width / 100))
  const raw = duration / target
  for (const s of [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600]) {
    if (s >= raw) return s
  }
  return Math.ceil(raw / 3600) * 3600
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Timeline(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const currentTime = useEditorStore((s) => s.currentTime)
  const duration = useEditorStore((s) => s.duration)
  const segments = useEditorStore((s) => s.segments)
  const keyframes = useEditorStore((s) => s.keyframes)
  const markIn = useEditorStore((s) => s.markIn)
  const markOut = useEditorStore((s) => s.markOut)
  const activeSegmentId = useEditorStore((s) => s.activeSegmentId)

  // ── Draw without reallocating canvas buffer ───────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || duration <= 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth
    const H = container.clientHeight
    if (W <= 0 || H <= 0) return

    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Clear background
    ctx.fillStyle = '#16213e'
    ctx.fillRect(0, 0, W, H)

    // Time grid
    const step = calcTimeStep(duration, W)
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'center'
    for (let t = 0; t <= duration; t += step) {
      const x = (t / duration) * W
      ctx.strokeStyle = '#2d3a5c'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
      ctx.fillStyle = '#8892b0'
      ctx.fillText(formatTime(t), x, 12)
    }

    // Keyframe ticks
    ctx.fillStyle = '#4ecdc4'
    for (const kf of keyframes) {
      const x = (kf.time / duration) * W
      ctx.fillRect(x - 0.5, 0, 1, 6)
    }

    // Segments
    for (const seg of segments) {
      const x1 = (seg.start / duration) * W
      const x2 = (seg.end / duration) * W
      ctx.globalAlpha = seg.id === activeSegmentId ? 0.5 : 0.3
      ctx.fillStyle = seg.color
      ctx.fillRect(x1, 18, Math.max(2, x2 - x1), H - 22)
      ctx.globalAlpha = 1
      ctx.strokeStyle = seg.color
      ctx.lineWidth = seg.id === activeSegmentId ? 2 : 1
      ctx.strokeRect(x1, 18, Math.max(2, x2 - x1), H - 22)
    }

    // Mark in / out lines
    if (markIn !== null) {
      const x = (markIn / duration) * W
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    if (markOut !== null) {
      const x = (markOut / duration) * W
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }

    // In–out highlight zone
    if (markIn !== null && markOut !== null && markOut > markIn) {
      const x1 = (markIn / duration) * W
      const x2 = (markOut / duration) * W
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x1, 0, x2 - x1, H)
      ctx.globalAlpha = 1
    }

    // Playhead
    const px = Math.max(0, Math.min((currentTime / duration) * W, W))
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(px, 0)
    ctx.lineTo(px, H)
    ctx.stroke()

    // Playhead handle
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.moveTo(px - 6, 0)
    ctx.lineTo(px + 6, 0)
    ctx.lineTo(px, 8)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }, [currentTime, duration, segments, keyframes, markIn, markOut, activeSegmentId])

  // Resize canvas ONLY on size change
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const handleResize = (): void => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      draw()
    }

    const obs = new ResizeObserver(handleResize)
    obs.observe(container)
    handleResize()
    return () => obs.disconnect()
  }, [draw])

  useEffect(() => {
    draw()
  }, [draw])

  // ── Seek on click / drag ──────────────────────────────────────────────

  const seekFrom = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const el = containerRef.current
      if (!el || duration <= 0) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const time = (x / rect.width) * duration
      const video =
        ((window as any).__videoElement as HTMLVideoElement | undefined) ||
        (document.querySelector('video') as HTMLVideoElement | null)
      if (video) {
        video.currentTime = time
      }
      useEditorStore.getState().setCurrentTime(time)
    },
    [duration]
  )

  const onDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      seekFrom(e)
    },
    [seekFrom]
  )

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent): void => seekFrom(e)
    const onUp = (): void => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging, seekFrom])

  return (
    <div className="timeline" ref={containerRef} onMouseDown={onDown}>
      <canvas ref={canvasRef} className="timeline-canvas" />
      <div className="timeline-time-display">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  )
}
