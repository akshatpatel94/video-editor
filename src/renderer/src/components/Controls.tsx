import React, { useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'

function formatCompactTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${m}:${String(s).padStart(2, '0')}.${ms}`
}

export default function Controls(): React.ReactElement | null {
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const currentTime = useEditorStore((s) => s.currentTime)
  const duration = useEditorStore((s) => s.duration)
  const markIn = useEditorStore((s) => s.markIn)
  const markOut = useEditorStore((s) => s.markOut)
  const filePath = useEditorStore((s) => s.filePath)

  const setMarkIn = useEditorStore((s) => s.setMarkIn)
  const setMarkOut = useEditorStore((s) => s.setMarkOut)
  const addSegmentFromMarks = useEditorStore((s) => s.addSegmentFromMarks)
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying)
  const splitAt = useEditorStore((s) => s.splitAt)
  const trimStartTo = useEditorStore((s) => s.trimStartTo)
  const trimEndTo = useEditorStore((s) => s.trimEndTo)
  const cutOutSelection = useEditorStore((s) => s.cutOutSelection)
  const trimToSelection = useEditorStore((s) => s.trimToSelection)

  const vid = (): HTMLVideoElement | undefined =>
    ((window as any).__videoElement as HTMLVideoElement | undefined) ||
    (document.querySelector('video') as HTMLVideoElement | null) ||
    undefined

  const togglePlay = useCallback(() => {
    const v = vid()
    if (!v) return
    if (v.paused) {
      v.play().catch(console.error)
      setIsPlaying(true)
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }, [setIsPlaying])

  const seekTo = useCallback(
    (targetTime: number) => {
      const v = vid()
      const totalDur = v && !isNaN(v.duration) && v.duration > 0 ? v.duration : duration
      const boundedTime = Math.max(0, Math.min(targetTime, totalDur || targetTime))
      if (v && isFinite(boundedTime)) {
        v.currentTime = boundedTime
      }
      useEditorStore.getState().setCurrentTime(boundedTime)
    },
    [duration]
  )

  const seekRel = useCallback(
    (delta: number) => {
      const v = vid()
      const current = v ? v.currentTime : currentTime
      seekTo(current + delta)
    },
    [currentTime, seekTo]
  )

  const snapKF = useCallback(
    async (dir: 'before' | 'after') => {
      const v = vid()
      const current = v ? v.currentTime : currentTime
      try {
        const t = await window.electronAPI.snapKeyframe(current, dir)
        if (typeof t === 'number' && !isNaN(t) && isFinite(t) && Math.abs(t - current) > 0.01) {
          seekTo(t)
        } else {
          seekRel(dir === 'before' ? -1 : 1)
        }
      } catch {
        seekRel(dir === 'before' ? -1 : 1)
      }
    },
    [currentTime, seekTo, seekRel]
  )

  const handleSetMarkIn = useCallback(() => {
    const v = vid()
    const t = v ? v.currentTime : currentTime
    setMarkIn(t)
  }, [currentTime, setMarkIn])

  const handleSetMarkOut = useCallback(() => {
    const v = vid()
    const t = v ? v.currentTime : currentTime
    setMarkOut(t)
  }, [currentTime, setMarkOut])

  const handleSplit = useCallback(() => {
    const v = vid()
    const t = v ? v.currentTime : currentTime
    splitAt(t)
  }, [currentTime, splitAt])

  const handleTrimStart = useCallback(() => {
    const v = vid()
    const t = v ? v.currentTime : currentTime
    trimStartTo(t)
  }, [currentTime, trimStartTo])

  const handleTrimEnd = useCallback(() => {
    const v = vid()
    const t = v ? v.currentTime : currentTime
    trimEndTo(t)
  }, [currentTime, trimEndTo])

  const hasSelection = markIn !== null && markOut !== null && markIn < markOut

  if (!filePath) return null

  return (
    <div className="controls">
      {/* ── Group 1: Navigation & Transport ── */}
      <div className="controls-group">
        <button className="ctrl-btn" onClick={() => seekTo(0)} title="Jump to start (Home)">
          ⏮
        </button>
        <button className="ctrl-btn" onClick={() => snapKF('before')} title="Previous keyframe">
          ⏪
        </button>
        <button className="ctrl-btn" onClick={() => seekRel(-5)} title="Back 5s">
          ◁ 5s
        </button>
        <button className="ctrl-btn" onClick={() => seekRel(-1)} title="Back 1s">
          ◁ 1s
        </button>
        <button
          className="ctrl-btn play-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={() => seekRel(1)} title="Forward 1s">
          1s ▷
        </button>
        <button className="ctrl-btn" onClick={() => seekRel(5)} title="Forward 5s">
          5s ▷
        </button>
        <button className="ctrl-btn" onClick={() => snapKF('after')} title="Next keyframe">
          ⏩
        </button>
        <button
          className="ctrl-btn"
          onClick={() => {
            const v = vid()
            const total = v?.duration || duration
            if (total > 0) seekTo(total)
          }}
          title="Jump to end (End)"
        >
          ⏭
        </button>
      </div>

      <div className="controls-separator" />

      {/* ── Group 2: Cut & Trim Tools ── */}
      <div className="controls-group">
        <button
          className="ctrl-btn trim-btn"
          onClick={handleTrimStart}
          title="Trim Start: Cut off everything before playhead (Q / [)"
        >
          ✂️ Trim Start
        </button>
        <button
          className="ctrl-btn split-btn"
          onClick={handleSplit}
          title="Cut / Split video at playhead (C / S)"
        >
          ✂️ Cut (Split)
        </button>
        <button
          className="ctrl-btn trim-btn"
          onClick={handleTrimEnd}
          title="Trim End: Cut off everything after playhead (W / ])"
        >
          Trim End ✂️
        </button>
      </div>

      <div className="controls-separator" />

      {/* ── Group 3: Cut Out Section & Range Marking ── */}
      <div className="controls-group">
        <button
          className={`ctrl-btn mark-in ${markIn !== null ? 'active' : ''}`}
          onClick={handleSetMarkIn}
          title="Mark Start of cut or segment (I)"
        >
          [ In {markIn !== null ? `(${formatCompactTime(markIn)})` : ''}
        </button>
        <button
          className={`ctrl-btn mark-out ${markOut !== null ? 'active' : ''}`}
          onClick={handleSetMarkOut}
          title="Mark End of cut or segment (O)"
        >
          Out ] {markOut !== null ? `(${formatCompactTime(markOut)})` : ''}
        </button>
        {(markIn !== null || markOut !== null) && (
          <button
            className="ctrl-btn clear-marks-btn"
            onClick={() => {
              setMarkIn(null)
              setMarkOut(null)
            }}
            title="Clear In/Out marks"
          >
            ✕
          </button>
        )}

        {hasSelection ? (
          <>
            <button
              className="ctrl-btn cutout-btn"
              onClick={() => cutOutSelection(markIn!, markOut!)}
              title="Cut Out & Remove: Delete this marked portion and automatically keep surrounding parts to merge"
            >
              ✂️ Cut Out &amp; Remove
            </button>
            <button
              className="ctrl-btn add-seg"
              onClick={() => trimToSelection(markIn!, markOut!)}
              title="Keep Selection: Keep ONLY this marked portion and discard rest"
            >
              ⭐ Keep Selection
            </button>
            <button
              className="ctrl-btn add-seg"
              onClick={addSegmentFromMarks}
              title="Add this range as a segment (Enter)"
            >
              ＋ Add Segment
            </button>
          </>
        ) : (
          <>
            <button
              className="ctrl-btn cutout-btn"
              onClick={() => {
                alert(
                  'To cut out an unwanted section:\n\n1. Move playhead to start of section and click [ In (or press I)\n2. Move playhead to end of section and click Out ] (or press O)\n3. Click "Cut Out & Remove" to slice that section out!\n\nAll remaining segments will be automatically merged into one video.'
                )
              }}
              title="Click for guide on cutting out unwanted sections"
              style={{ opacity: 0.75 }}
            >
              ✂️ Cut Out Section
            </button>
            <button
              className="ctrl-btn add-seg"
              onClick={addSegmentFromMarks}
              title="Add segment from marked region or full clip (Enter)"
            >
              ＋ Add Segment
            </button>
          </>
        )}
      </div>
    </div>
  )
}
