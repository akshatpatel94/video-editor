import React, { useCallback, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import MergeFilesModal from './MergeFilesModal'

export default function Toolbar(): React.ReactElement {
  const [showMergeModal, setShowMergeModal] = useState(false)

  const filePath = useEditorStore((s) => s.filePath)
  const mediaInfo = useEditorStore((s) => s.mediaInfo)
  const segments = useEditorStore((s) => s.segments)
  const mergeSegments = useEditorStore((s) => s.mergeSegments)
  const setMergeSegments = useEditorStore((s) => s.setMergeSegments)
  const isExporting = useEditorStore((s) => s.isExporting)
  const exportProgress = useEditorStore((s) => s.exportProgress)
  const markIn = useEditorStore((s) => s.markIn)
  const markOut = useEditorStore((s) => s.markOut)

  const setFilePath = useEditorStore((s) => s.setFilePath)
  const setMediaInfo = useEditorStore((s) => s.setMediaInfo)
  const setKeyframes = useEditorStore((s) => s.setKeyframes)
  const setIsExporting = useEditorStore((s) => s.setIsExporting)
  const setExportProgress = useEditorStore((s) => s.setExportProgress)
  const reset = useEditorStore((s) => s.reset)

  // ── Open ──────────────────────────────────────────────────────────────

  const handleOpen = useCallback(async () => {
    const path = await window.electronAPI.openFile()
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
  }, [reset, setFilePath, setMediaInfo, setKeyframes])

  // ── Export ─────────────────────────────────────────────────────────────

  const handleExport = useCallback(async (forceMerge?: boolean) => {
    if (!filePath) return

    // If user has no segments in the list, but marked In or Out, trim to that range
    let segmentsToExport = [...segments]
    if (segmentsToExport.length === 0) {
      const { markIn, markOut, duration } = useEditorStore.getState()
      const start = markIn !== null ? markIn : 0
      const end = markOut !== null ? markOut : duration
      if (start < end) {
        segmentsToExport = [
          {
            id: 'auto-trim',
            start,
            end,
            name: 'Trimmed Video',
            color: '#4ecdc4'
          }
        ]
      }
    }

    if (segmentsToExport.length === 0) {
      alert('Please cut or mark video segments before exporting.')
      return
    }

    const outputDir = await window.electronAPI.saveDirectory()
    if (!outputDir) return

    setIsExporting(true)
    setExportProgress(0)
    const off = window.electronAPI.onExportProgress(({ percent }) =>
      setExportProgress(percent)
    )

    try {
      const shouldMerge =
        forceMerge !== undefined
          ? forceMerge
          : (mergeSegments && segmentsToExport.length > 1)

      const result = await window.electronAPI.exportSegments(
        filePath,
        segmentsToExport,
        outputDir,
        shouldMerge
      )
      if (result.success) {
        alert(
          `Export complete!\n\nExported ${result.files?.length} file(s):\n${result.files?.join('\n')}`
        )
      } else {
        alert(`Export failed: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`)
    } finally {
      off()
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [filePath, segments, mergeSegments, setIsExporting, setExportProgress])

  const fmtSize = (b: number): string => {
    if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
    if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
    return `${(b / 1e3).toFixed(0)} KB`
  }

  const videoStream = mediaInfo?.streams.find((s) => s.codecType === 'video')
  const hasExportableContent =
    segments.length > 0 || markIn !== null || markOut !== null

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="app-title">✂️ ClippyCut</span>

          <button className="toolbar-btn" onClick={handleOpen} title="Open a video file">
            📂 Open Video
          </button>

          <button
            className="toolbar-btn"
            onClick={() => setShowMergeModal(true)}
            title="Combine multiple separate video files into one"
          >
            🔀 Merge Files...
          </button>

          {segments.length > 1 ? (
            <>
              <button
                className="toolbar-btn export-btn"
                onClick={() => handleExport(true)}
                disabled={!filePath || !hasExportableContent || isExporting}
                title="Stitch all cut segments into 1 continuous video file via direct stream copy"
              >
                {isExporting
                  ? `⏳ Merging & Exporting ${Math.round(exportProgress)}%`
                  : `🔀 Merge & Export (1 Video)`}
              </button>

              <button
                className="toolbar-btn"
                onClick={() => handleExport(false)}
                disabled={!filePath || !hasExportableContent || isExporting}
                title="Export each cut segment as a separate video file"
              >
                📦 Export Separate Clips
              </button>
            </>
          ) : (
            <button
              className="toolbar-btn export-btn"
              onClick={() => handleExport(false)}
              disabled={!filePath || !hasExportableContent || isExporting}
              title="Export cut or trimmed video instantly via FFmpeg stream copy"
            >
              {isExporting
                ? `⏳ Exporting ${Math.round(exportProgress)}%`
                : `💾 Export Video`}
            </button>
          )}
        </div>

        <div className="toolbar-right">
          {mediaInfo && (
            <span className="file-info">
              {mediaInfo.fileName} • {fmtSize(mediaInfo.fileSize)}
              {videoStream && (
                <>
                  {' '}• {videoStream.width}×{videoStream.height}
                  {' '}• {videoStream.codecName?.toUpperCase()}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <MergeFilesModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        onMergeComplete={async (outputPath) => {
          if (confirm(`Do you want to open the merged video in the editor now?\n\n${outputPath}`)) {
            reset()
            setFilePath(outputPath)
            try {
              const info = await window.electronAPI.probe(outputPath)
              setMediaInfo(info)
              window.electronAPI.getKeyframes(outputPath).then(setKeyframes).catch(console.error)
            } catch (err) {
              console.error('Probe failed:', err)
            }
          }
        }}
      />
    </>
  )
}
