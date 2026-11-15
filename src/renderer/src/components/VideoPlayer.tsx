import React, { useRef, useEffect, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

/**
 * Video player component.
 *
 * Streams local files via real local HTTP server with RFC-compliant 206 Partial Content.
 * This guarantees that forward, rewind, scrub, and keyframe jumps work instantaneously
 * without custom protocol seek restrictions.
 */
export default function VideoPlayer(): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined)

  const filePath = useEditorStore((s) => s.filePath)
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime)
  const setDuration = useEditorStore((s) => s.setDuration)
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying)

  // Fetch local HTTP streaming URL whenever the file changes
  useEffect(() => {
    let active = true
    if (filePath) {
      window.electronAPI
        .getStreamUrl(filePath)
        .then((url) => {
          if (active) setVideoSrc(url)
        })
        .catch(console.error)
    } else {
      setVideoSrc(undefined)
    }
    return () => {
      active = false
    }
  }, [filePath])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    ;(window as any).__videoElement = v

    const onPlay = (): void => setIsPlaying(true)
    const onPause = (): void => {
      setIsPlaying(false)
      setCurrentTime(v.currentTime)
    }
    const onTimeUpdate = (): void => {
      setCurrentTime(v.currentTime)
    }
    const onSeeked = (): void => {
      setCurrentTime(v.currentTime)
    }
    const onMeta = (): void => {
      if (v.duration && !isNaN(v.duration) && isFinite(v.duration)) {
        setDuration(v.duration)
      }
    }

    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('seeked', onSeeked)
    v.addEventListener('loadedmetadata', onMeta)

    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('seeked', onSeeked)
      v.removeEventListener('loadedmetadata', onMeta)
    }
  }, [videoSrc, setDuration, setCurrentTime, setIsPlaying])

  return (
    <div className="video-player">
      {filePath && videoSrc ? (
        <video
          ref={(el) => {
            videoRef.current = el
            ;(window as any).__videoElement = el
          }}
          src={videoSrc}
          className="video-element"
          controls
          playsInline
        />
      ) : (
        <div className="video-placeholder">
          <div className="placeholder-content">
            <span className="placeholder-icon">🎬</span>
            <p>Open a video file to begin editing</p>
            <p className="placeholder-hint">File → Open &nbsp;or&nbsp; drag &amp; drop a file</p>
          </div>
        </div>
      )}
    </div>
  )
}
