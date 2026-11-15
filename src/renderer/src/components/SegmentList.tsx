import React, { useCallback, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

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

export default function SegmentList(): React.ReactElement | null {
  const segments = useEditorStore((s) => s.segments)
  const activeSegmentId = useEditorStore((s) => s.activeSegmentId)
  const previewingSegmentId = useEditorStore((s) => s.previewingSegmentId)
  const isPreviewingMerged = useEditorStore((s) => s.isPreviewingMerged)
  const mergeSegments = useEditorStore((s) => s.mergeSegments)
  const setMergeSegments = useEditorStore((s) => s.setMergeSegments)
  const setActiveSegment = useEditorStore((s) => s.setActiveSegment)
  const setPreviewingSegmentId = useEditorStore((s) => s.setPreviewingSegmentId)
  const setIsPreviewingMerged = useEditorStore((s) => s.setIsPreviewingMerged)
  const removeSegment = useEditorStore((s) => s.removeSegment)
  const updateSegment = useEditorStore((s) => s.updateSegment)
  const clearSegments = useEditorStore((s) => s.clearSegments)
  const filePath = useEditorStore((s) => s.filePath)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const vid = (): HTMLVideoElement | undefined =>
    ((window as any).__videoElement as HTMLVideoElement | undefined) ||
    (document.querySelector('video') as HTMLVideoElement | null) ||
    undefined

  const handleSeekSegment = useCallback(
    (id: string, start: number) => {
      setActiveSegment(id)
      const v = vid()
      if (v) v.currentTime = start
      useEditorStore.getState().setCurrentTime(start)
    },
    [setActiveSegment]
  )

  const handlePreviewSegment = useCallback(
    (id: string, start: number, end: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const v = vid()
      if (!v) return

      if (previewingSegmentId === id && !v.paused) {
        v.pause()
        setPreviewingSegmentId(null)
        return
      }

      v.currentTime = start
      setPreviewingSegmentId(id)
      setActiveSegment(id)
      v.play().catch(console.error)

      // Watch for segment end
      const checkEnd = (): void => {
        if (v.currentTime >= end || v.paused) {
          v.pause()
          setPreviewingSegmentId(null)
          v.removeEventListener('timeupdate', checkEnd)
        }
      }
      v.addEventListener('timeupdate', checkEnd)
    },
    [previewingSegmentId, setActiveSegment, setPreviewingSegmentId]
  )

  const startRename = (id: string, currentName: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    setEditingId(id)
    setEditName(currentName)
  }

  const saveRename = (id: string): void => {
    if (editName.trim()) {
      updateSegment(id, { name: editName.trim() })
    }
    setEditingId(null)
  }

  const handleSetStartToNow = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    const v = vid()
    if (!v) return
    const seg = segments.find((s) => s.id === id)
    if (seg && v.currentTime < seg.end) {
      updateSegment(id, { start: v.currentTime })
    }
  }

  const handleSetEndToNow = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    const v = vid()
    if (!v) return
    const seg = segments.find((s) => s.id === id)
    if (seg && v.currentTime > seg.start) {
      updateSegment(id, { end: v.currentTime })
    }
  }

  // ── Preview All Cut Segments Merged ───────────────────────────────────

  const handlePreviewMerged = useCallback(() => {
    const v = vid()
    if (!v || segments.length === 0) return

    if (isPreviewingMerged) {
      v.pause()
      setIsPreviewingMerged(false)
      return
    }

    const sorted = [...segments].sort((a, b) => a.start - b.start)
    v.currentTime = sorted[0].start
    setActiveSegment(sorted[0].id)
    setIsPreviewingMerged(true)
    v.play().catch(console.error)

    const onUpdate = (): void => {
      const cur = v.currentTime
      const currentSorted = [...useEditorStore.getState().segments].sort((a, b) => a.start - b.start)
      if (currentSorted.length === 0 || v.paused) {
        setIsPreviewingMerged(false)
        v.removeEventListener('timeupdate', onUpdate)
        return
      }

      const curIdx = currentSorted.findIndex((s) => cur >= s.start - 0.05 && cur < s.end - 0.05)
      if (curIdx !== -1) {
        if (cur >= currentSorted[curIdx].end - 0.08) {
          if (curIdx + 1 < currentSorted.length) {
            v.currentTime = currentSorted[curIdx + 1].start
            setActiveSegment(currentSorted[curIdx + 1].id)
          } else {
            v.pause()
            setIsPreviewingMerged(false)
            v.removeEventListener('timeupdate', onUpdate)
          }
        }
      } else {
        const next = currentSorted.find((s) => s.start > cur)
        if (next) {
          v.currentTime = next.start
          setActiveSegment(next.id)
        } else {
          v.pause()
          setIsPreviewingMerged(false)
          v.removeEventListener('timeupdate', onUpdate)
        }
      }
    }

    v.addEventListener('timeupdate', onUpdate)
  }, [isPreviewingMerged, segments, setActiveSegment, setIsPreviewingMerged])

  if (!filePath) return null

  const totalDuration = segments.reduce((acc, s) => acc + (s.end - s.start), 0)

  return (
    <div className="segment-list">
      <div className="segment-list-header">
        <div>
          <h3>Segments ({segments.length})</h3>
          {segments.length > 0 && (
            <span className="total-time">Total: {formatTime(totalDuration)}</span>
          )}
        </div>
        {segments.length > 0 && (
          <button className="clear-btn" onClick={clearSegments} title="Clear all segments">
            🗑
          </button>
        )}
      </div>

      {segments.length > 1 && (
        <div className="segment-merge-bar">
          <label className="merge-toggle" style={{ margin: 0 }} title="All cut segments will be seamlessly merged into 1 file on export">
            <input
              type="checkbox"
              checked={mergeSegments}
              onChange={(e) => setMergeSegments(e.target.checked)}
            />
            <span style={{ color: '#86efac', fontWeight: 600 }}>🔀 Merge on Export: ON</span>
          </label>
          <span style={{ color: 'var(--text-muted)' }}>{segments.length} clips</span>
        </div>
      )}

      {segments.length > 0 && (
        <button
          className={`preview-merged-btn ${isPreviewingMerged ? 'playing' : ''}`}
          onClick={handlePreviewMerged}
          title={isPreviewingMerged ? 'Pause merged preview' : 'Watch all cut segments played sequentially (skips cut-out parts)'}
        >
          {isPreviewingMerged ? '⏸ Pause Merged Preview' : '▶ Preview Merged Video'}
        </button>
      )}

      {segments.length === 0 ? (
        <div className="segment-empty">
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No cut segments</p>
          <div className="segment-empty-hint" style={{ textAlign: 'left', marginTop: '10px' }}>
            <p style={{ marginBottom: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
              How to Cut &amp; Merge:
            </p>
            <p style={{ marginBottom: '6px' }}>
              ✂️ <b>Cut at Playhead</b>: Press <kbd>C</kbd> or click <b>✂️ Cut (Split)</b> to slice the video into segments.
            </p>
            <p style={{ marginBottom: '6px' }}>
              ✂️ <b>Cut Out Section</b>: Mark <kbd>I</kbd> and <kbd>O</kbd>, then click <b>✂️ Cut Out &amp; Remove</b> to delete that part.
            </p>
            <p>
              🔀 <b>Merge</b>: Click <b>🔀 Merge &amp; Export</b> in the toolbar to join all segments into 1 continuous video file!
            </p>
          </div>
        </div>
      ) : (
        <div className="segment-items">
          {segments.map((seg) => {
            const isPlayingThis = previewingSegmentId === seg.id
            const isActive = seg.id === activeSegmentId
            return (
              <div
                key={seg.id}
                className={`segment-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSeekSegment(seg.id, seg.start)}
              >
                <div className="segment-color" style={{ backgroundColor: seg.color }} />

                <div className="segment-info">
                  {editingId === seg.id ? (
                    <input
                      type="text"
                      className="segment-name-input"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveRename(seg.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(seg.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className="segment-name"
                      onDoubleClick={(e) => startRename(seg.id, seg.name, e)}
                      title="Double-click to rename"
                    >
                      {seg.name}
                    </div>
                  )}

                  <div className="segment-times">
                    {formatTime(seg.start)} → {formatTime(seg.end)}
                    <span className="segment-duration">
                      ({formatTime(seg.end - seg.start)})
                    </span>
                  </div>

                  <div className="segment-quick-actions">
                    <button
                      className="quick-action-btn"
                      onClick={(e) => handleSetStartToNow(seg.id, e)}
                      title="Set segment start to current playhead"
                    >
                      [ Start
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={(e) => handleSetEndToNow(seg.id, e)}
                      title="Set segment end to current playhead"
                    >
                      End ]
                    </button>
                  </div>
                </div>

                <div className="segment-actions">
                  <button
                    className={`preview-seg-btn ${isPlayingThis ? 'playing' : ''}`}
                    onClick={(e) => handlePreviewSegment(seg.id, seg.start, seg.end, e)}
                    title={isPlayingThis ? 'Pause preview' : 'Preview this segment only'}
                  >
                    {isPlayingThis ? '⏸' : '▶'}
                  </button>
                  <button
                    className="segment-remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSegment(seg.id)
                    }}
                    title="Delete segment"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
