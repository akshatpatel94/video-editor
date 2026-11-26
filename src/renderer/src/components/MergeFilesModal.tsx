import React, { useState, useCallback } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onMergeComplete?: (outputPath: string) => void
}

export default function MergeFilesModal({
  isOpen,
  onClose,
  onMergeComplete
}: Props): React.ReactElement | null {
  const [files, setFiles] = useState<string[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [transitionType, setTransitionType] = useState<string>('none')
  const [transitionDuration, setTransitionDuration] = useState<number>(1.0)

  const handleAddFiles = useCallback(async () => {
    try {
      const selected = await window.electronAPI.openMultipleFiles()
      if (selected && selected.length > 0) {
        setFiles((prev) => [...prev, ...selected])
      }
    } catch (err) {
      console.error('Failed to open files:', err)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFiles: string[] = []
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const f = e.dataTransfer.files[i] as any
      if (f.path) droppedFiles.push(f.path)
    }
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const moveUp = (index: number): void => {
    if (index === 0) return
    setFiles((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const moveDown = (index: number): void => {
    if (index === files.length - 1) return
    setFiles((prev) => {
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const removeFile = (index: number): void => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMerge = async (): Promise<void> => {
    if (files.length < 2) {
      alert('Please select at least 2 video files to merge.')
      return
    }

    const firstExt = files[0].substring(files[0].lastIndexOf('.')) || '.mp4'
    const defaultName = `merged_${Date.now()}${firstExt}`
    const savePath = await window.electronAPI.saveFile(defaultName)
    if (!savePath) return

    setIsMerging(true)
    setProgress(10)

    const off = window.electronAPI.onExportProgress(({ percent }) => {
      setProgress(percent)
    })

    try {
      const transitionConfig =
        transitionType !== 'none'
          ? { type: transitionType as any, duration: transitionDuration }
          : undefined

      const res = await window.electronAPI.mergeFiles(files, savePath, transitionConfig)
      if (res.success && res.file) {
        alert(`Success! Merged ${files.length} files into:\n${res.file}`)
        onMergeComplete?.(res.file)
        onClose()
      } else {
        alert(`Merge failed: ${res.error}`)
      }
    } catch (err: any) {
      alert(`Error merging files: ${err.message}`)
    } finally {
      off()
      setIsMerging(false)
      setProgress(0)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span style={{ fontSize: '18px' }}>🔀</span>
            <h3>Merge Multiple Video Files</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Combine multiple separate videos into a single file with <b>zero generation loss</b> and near-instant speed using FFmpeg stream copy (<code>-c copy</code>).
          </p>

          <div
            className="merge-drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <button className="toolbar-btn primary-btn" onClick={handleAddFiles} disabled={isMerging}>
              ➕ Add Video Files...
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              or drag &amp; drop files here
            </span>
          </div>

          <div className="merge-file-list">
            {files.length === 0 ? (
              <div className="merge-empty">No files added yet. Click &quot;Add Video Files&quot; to begin.</div>
            ) : (
              files.map((f, i) => {
                const name = f.split(/[\\/]/).pop() || f
                return (
                  <div key={`${f}-${i}`} className="merge-file-row">
                    <span className="merge-file-num">{i + 1}</span>
                    <span className="merge-file-name" title={f}>
                      {name}
                    </span>
                    <div className="merge-file-actions">
                      <button
                        className="modal-icon-btn"
                        onClick={() => moveUp(i)}
                        disabled={i === 0 || isMerging}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        className="modal-icon-btn"
                        onClick={() => moveDown(i)}
                        disabled={i === files.length - 1 || isMerging}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        className="modal-icon-btn remove"
                        onClick={() => removeFile(i)}
                        disabled={isMerging}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="merge-modal-transitions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                ✨ Transition:
              </span>
              <select
                className="transition-select"
                value={transitionType}
                onChange={(e) => setTransitionType(e.target.value)}
                disabled={isMerging}
              >
                <option value="none">None (Direct Cut)</option>
                <option value="fade">✨ Crossfade (Dissolve)</option>
                <option value="fadeblack">🎬 Dip to Black</option>
                <option value="fadewhite">⚡ Flash White</option>
                <option value="wipeleft">👉 Wipe Left</option>
                <option value="wiperight">👈 Wipe Right</option>
                <option value="slideleft">⏩ Slide Left</option>
                <option value="slideright">⏪ Slide Right</option>
              </select>

              {transitionType !== 'none' && (
                <select
                  className="transition-select duration-select"
                  value={transitionDuration}
                  onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                  disabled={isMerging}
                >
                  <option value="0.5">0.5s</option>
                  <option value="1.0">1.0s</option>
                  <option value="1.5">1.5s</option>
                  <option value="2.0">2.0s</option>
                </select>
              )}
            </div>
          </div>

          {isMerging && (
            <div className="merge-progress-box">
              <div className="merge-progress-bar" style={{ width: `${progress}%` }} />
              <span className="merge-progress-text">
                Merging video streams... {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="toolbar-btn"
            onClick={() => setFiles([])}
            disabled={files.length === 0 || isMerging}
          >
            Clear All
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="toolbar-btn" onClick={onClose} disabled={isMerging}>
              Cancel
            </button>
            <button
              className="toolbar-btn export-btn"
              onClick={handleMerge}
              disabled={files.length < 2 || isMerging}
            >
              {isMerging ? '⏳ Merging...' : `⚡ Merge ${files.length} Files`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
