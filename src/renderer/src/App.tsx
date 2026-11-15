import React, { useEffect, useCallback } from 'react'
import Toolbar from './components/Toolbar'
import VideoPlayer from './components/VideoPlayer'
import Timeline from './components/Timeline'
import Controls from './components/Controls'
import SegmentList from './components/SegmentList'
import { useEditorStore } from './store/editorStore'

export default function App(): React.ReactElement {
  const setFilePath = useEditorStore((s) => s.setFilePath)
  const setMediaInfo = useEditorStore((s) => s.setMediaInfo)
  const setKeyframes = useEditorStore((s) => s.setKeyframes)
  const setMarkIn = useEditorStore((s) => s.setMarkIn)
  const setMarkOut = useEditorStore((s) => s.setMarkOut)
  const addSegmentFromMarks = useEditorStore((s) => s.addSegmentFromMarks)
  const splitAt = useEditorStore((s) => s.splitAt)
  const cutOutSelection = useEditorStore((s) => s.cutOutSelection)
  const trimStartTo = useEditorStore((s) => s.trimStartTo)
  const trimEndTo = useEditorStore((s) => s.trimEndTo)
  const removeSegment = useEditorStore((s) => s.removeSegment)
  const activeSegmentId = useEditorStore((s) => s.activeSegmentId)
  const reset = useEditorStore((s) => s.reset)

  // ── Keyboard shortcuts ────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // Ignore when typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      const v =
        ((window as any).__videoElement as HTMLVideoElement | undefined) ||
        (document.querySelector('video') as HTMLVideoElement | null)
      if (!v) return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          v.paused ? v.play() : v.pause()
          break
        case 'i':
          setMarkIn(v.currentTime)
          break
        case 'o':
          setMarkOut(v.currentTime)
          break
        case 'c':
        case 's':
          e.preventDefault()
          splitAt(v.currentTime)
          break
        case 'x': {
          const { markIn, markOut } = useEditorStore.getState()
          if (markIn !== null && markOut !== null && markIn < markOut) {
            e.preventDefault()
            cutOutSelection(markIn, markOut)
          }
          break
        }
        case 'q':
        case '[':
          e.preventDefault()
          trimStartTo(v.currentTime)
          break
        case 'w':
        case ']':
          e.preventDefault()
          trimEndTo(v.currentTime)
          break
        case 'enter':
          e.preventDefault()
          addSegmentFromMarks()
          break
        case 'delete':
        case 'backspace':
          if (activeSegmentId) {
            e.preventDefault()
            removeSegment(activeSegmentId)
          }
          break
        case 'arrowleft':
        case 'j':
          e.preventDefault()
          v.currentTime = Math.max(
            0,
            v.currentTime - (e.shiftKey ? 10 : e.ctrlKey ? 0.04 : 1)
          )
          break
        case 'arrowright':
        case 'l':
          e.preventDefault()
          v.currentTime = Math.min(
            v.duration,
            v.currentTime + (e.shiftKey ? 10 : e.ctrlKey ? 0.04 : 1)
          )
          break
        case 'home':
          v.currentTime = 0
          break
        case 'end':
          v.currentTime = v.duration
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMarkIn, setMarkOut, addSegmentFromMarks, splitAt, trimStartTo, trimEndTo, removeSegment, activeSegmentId])

  // ── Drag & drop ───────────────────────────────────────────────────────

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (!file) return
      const path = (file as any).path as string | undefined
      if (!path) return

      reset()
      setFilePath(path)
      try {
        const info = await window.electronAPI.probe(path)
        setMediaInfo(info)
        window.electronAPI.getKeyframes(path).then(setKeyframes).catch(console.error)
      } catch (err) {
        console.error('Probe failed:', err)
      }
    },
    [reset, setFilePath, setMediaInfo, setKeyframes]
  )

  const preventDefault = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className="app" onDrop={handleDrop} onDragOver={preventDefault}>
      <Toolbar />
      <div className="main-content">
        <VideoPlayer />
        <SegmentList />
      </div>
      <Controls />
      <Timeline />
    </div>
  )
}
