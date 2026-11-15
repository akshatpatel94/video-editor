# ClippyCut - Fast Direct-Stream Video Editor

A lightning-fast, low-RAM video editor that cuts, trims, and merges large video files **without re-encoding**. Exports finish in seconds, not hours.

## Quick Start

```powershell
npm run dev
```

## Cut & Trim Capabilities

ClippyCut operates directly on the video bitstream via **FFmpeg stream copy (`-c copy`)**:

### 1. Split / Blade Tool (`✂️ Split` / `C` or `S`)
- Slices the video into two independent segments right at the current playhead position.
- If you're inside an existing segment, it splits that segment into Part 1 and Part 2.

### 2. Trim Start (`✂️ Trim Start` / `Q` or `[`)
- Discards everything before the current playhead position (keeps from current time to end).

### 3. Trim End (`Trim End ✂️` / `W` or `]`)
- Discards everything after the current playhead position (keeps from beginning to current time).

### 4. Keep Selection (`✂️ Keep Selection`)
- When you mark **`In`** (`I`) and **`Out`** (`O`), keeps *only* that marked portion and discards the rest.

### 5. Cut Out / Delete Section (`🗑️ Cut Out`)
- When you mark **`In`** (`I`) and **`Out`** (`O`) around an ad, dead air, or unwanted section, discards that marked region and keeps everything else.

### 6. Segment Preview (`▶`)
- In the right-hand **Segments** panel, click `▶` on any cut segment to play only that segment; it automatically pauses when the segment ends so you can verify your cut.

### 7. Merge vs Separate Export
- In the top toolbar, toggle **☑ Merge into 1 file**:
  - **Checked**: Stitches all cut segments together into a single continuous video via FFmpeg concat demuxer (direct stream copy).
  - **Unchecked**: Exports each cut segment as a separate numbered video file (`clip-001.mp4`, `clip-002.mp4`).

---

## Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| `Space` or `K` | Play / Pause |
| `C` or `S` | **Split / Cut video at playhead** |
| `Q` or `[` | **Trim Start** (discard everything before playhead) |
| `W` or `]` | **Trim End** (discard everything after playhead) |
| `I` | Set In point |
| `O` | Set Out point |
| `Enter` | Add marked region as a segment |
| `Delete` / `Backspace` | Delete active segment |
| `J` / `L` or `←` / `→` | Seek ±1 second |
| `Shift + ←/→` | Seek ±10 seconds |
| `Ctrl + ←/→` | Seek ±1 frame (~0.04s) |
| `Home` / `End` | Jump to start / end |

---

## Architecture & Low RAM Design

- **Local HTTP 206 Streaming**: Real range-request video server running on `127.0.0.1` streams chunks directly from disk at NVMe speeds; RAM stays < 150 MB even on 100 GB videos.
- **Hardware-Accelerated 2D Canvas Timeline**: Single `<canvas>` with zero DOM bloat.
- **Direct Stream Copy**: Exports finish in 2–5 seconds with 0% quality loss.
