# ClippyCut: User Guide & How It Works

**ClippyCut** is a lightweight, low-RAM desktop video editor engineered specifically for large video files (10 GB – 100 GB+). It allows you to slice, trim, split, and merge video segments with **zero generation loss** and near-instant exports.

---

## Table of Contents
1. [Core Concept: Direct Stream Editing vs Re-encoding](#1-core-concept-direct-stream-editing-vs-re-encoding)
2. [Step-by-Step User Workflow](#2-step-by-step-user-workflow)
   - [Step 1: Open Your Video](#step-1-open-your-video)
   - [Step 2: Scrubbing & Playback](#step-2-scrubbing--playback)
   - [Step 3: Cutting & Trimming](#step-3-cutting--trimming)
   - [Step 4: Managing & Previewing Segments](#step-4-managing--previewing-segments)
   - [Step 5: Exporting](#step-5-exporting)
3. [The 4 Ways to Cut and Trim](#3-the-4-ways-to-cut-and-trim)
4. [Under the Hood: Architecture & Low-RAM Engineering](#4-under-the-hood-architecture--low-ram-engineering)
5. [Complete Keyboard Shortcuts Cheat Sheet](#5-complete-keyboard-shortcuts-cheat-sheet)
6. [FAQ & Troubleshooting](#6-faq--troubleshooting)

---

## 1. Core Concept: Direct Stream Editing vs Re-encoding

Traditional video editors (Premiere Pro, DaVinci Resolve, Shotcut) decode compressed video packets into raw, uncompressed RGBA pixel buffers in memory. When exporting, they compress every single frame again from scratch:
- **Time**: A 1-hour 4K recording can take 30 to 90 minutes to export.
- **CPU/GPU**: Causes high system temperatures and fan noise.
- **Quality**: Compressing already-compressed video causes generational quality loss.
- **RAM**: Consumes tens of gigabytes of RAM just to cache decoded frames.

### How ClippyCut Works (Direct Stream Copying)
```
Input Video (e.g. 50 GB)
     │
     ▼
[Demuxer: Reads raw compressed packets without decoding]
     │
     ▼
[FFmpeg Packet Copy: -c copy] ──> Extracts or stitches container packets directly
     │
     ▼
Output Video (Created in 2–5 seconds at SSD write speed, 100% original quality)
```

ClippyCut never decompresses the video bitstream during export. It slices the file at the packet level and muxes it directly into the output container. Export speed is bounded only by your storage drive's write speed (NVMe / SSD).

---

## 2. Step-by-Step User Workflow

```mermaid
flowchart LR
    A["1. Open Video (Drag & Drop)"] --> B["2. Scrub & Find Cut Points"]
    B --> C["3. Cut / Split / Trim"]
    C --> D["4. Preview Cuts (▶)"]
    D --> E["5. Export (Merged or Separate)"]
```

### Step 1: Open Your Video
* Click **`📂 Open`** in the top-left toolbar, or drag and drop any video file into the window.
* Supports `.mp4`, `.mkv`, `.mov`, `.webm`, `.avi`, `.ts`, and more.
* The top toolbar displays file metadata (file size, resolution, and video codec).

### Step 2: Scrubbing & Playback
* Press <kbd>Space</kbd> or <kbd>K</kbd> to Play / Pause.
* Click anywhere on the bottom canvas timeline to jump directly to that timestamp.
* Use **`◁ 1s`**, **`◁ 5s`**, **`1s ▷`**, **`5s ▷`** to scrub back and forth.
* Use **`⏪`** and **`⏩`** to jump between keyframes (I-frames) for clean cut boundaries.

### Step 3: Cutting & Trimming
Choose whichever method fits your workflow:
* **Cut at playhead (Split)**: Click **`✂️ Cut (Split)`** (or press <kbd>C</kbd> / <kbd>S</kbd>). This slices the video at the playhead into two independent parts.
* **Cut out an unwanted section & join the rest (Ripple Delete)**:
  1. Move playhead to start of mistake/ad and click **`[ In`** (or press <kbd>I</kbd>).
  2. Move playhead to end of mistake/ad and click **`Out ]`** (or press <kbd>O</kbd>).
  3. Click **`✂️ Cut Out & Remove`** (or press <kbd>X</kbd>).
  4. The unwanted middle portion is deleted, and the parts before and after are automatically retained and merged!
* **Trim the start**: Click **`✂️ Trim Start`** (or press <kbd>Q</kbd> / <kbd>[</kbd>).
* **Trim the end**: Click **`Trim End ✂️`** (or press <kbd>W</kbd> / <kbd>]</kbd>).
* **Keep only marked range**: Mark **`[ In`** and **`Out ]`**, then click **`⭐ Keep Selection`**.

### Step 4: Managing, Previewing & Adding Transitions
* All cut segments appear in the **Segments** sidebar on the right.
* **Transitions**: To avoid jarring jump cuts between joined scenes, select a transition style from the **`✨ Transition`** menu in the Segments sidebar:
  - **`✨ Crossfade (Dissolve)`**: Smooth cinematic blend between scenes.
  - **`🎬 Dip to Black`**: Professional fade through black (ideal for scene or chapter changes).
  - **`⚡ Flash White`**: High-energy flash transition.
  - **`👉 Wipe Left / 👈 Wipe Right`**: Action directional wipe.
  - **`⏩ Slide Left / ⏪ Slide Right`**: Smooth modern push slide.
  - **`None (Direct Cut)`**: Instant jump cut with direct stream copy.
  - **Duration Picker**: Choose between 0.3s, 0.5s, 1.0s, 1.5s, or 2.0s.
  - Both video (`xfade`) and audio (`acrossfade`) are blended together to eliminate audio pops and visual jumps.
* **Preview Merged Video (`▶ Preview Merged Video`)**: Watch your cut segments played in sequence with a live status badge showing your active transition!
* Click **`▶`** on any individual segment card to preview only that clip.
* Double-click a segment's name to rename it (e.g., "Part 1", "Boss Fight").
* Use **`[ Start`** or **`End ]`** on a card to adjust a segment's boundary to the playhead.
* Click **`✕`** to delete an individual segment.

### Step 5: Exporting & Merging
1. **Merge into 1 Continuous Video**:
   - Click **`🔀 Merge & Export`** in the top toolbar.
   - When a transition is selected (e.g. Crossfade 1.0s), FFmpeg blends video and audio seamlessly with ultra-fast encoding.
   - When set to `None`, it runs direct stream copy (`-c copy`) in 2–5 seconds at SSD write speed.
2. **Export Separate Clips**:
   - Click **`📦 Export Separate Clips`** if you prefer each segment saved as its own numbered file (`video-001.mp4`, `video-002.mp4`).
3. **Merge Multiple Different Video Files from Disk**:
   - Click **`🔀 Merge Files...`** in the top toolbar.
   - Select or drag & drop two or more video files.
   - Choose your preferred transition (e.g. Crossfade, Dip to Black, or None).
   - Click **`⚡ Merge & Save Video`**!

---

## 3. The 5 Ways to Cut and Merge

| Workflow Goal | How to Do It | Result |
| :--- | :--- | :--- |
| **Cut out an unwanted section** (e.g. ad, cough, mistake) | Mark **`[ In`** (<kbd>I</kbd>) and **`Out ]`** (<kbd>O</kbd>), then click **`✂️ Cut Out & Remove`** (or <kbd>X</kbd>). | Deletes that section; keeps the surrounding parts automatically joined and ready to export as 1 video! |
| **Cut / Slice at playhead** (blade tool) | Scrub to any point, click **`✂️ Cut (Split)`** (or press <kbd>C</kbd>). | Slices the video into two independent segments at that exact point. |
| **Trim the beginning** (remove dead air before video starts) | Scrub to where the action begins, click **`✂️ Trim Start`** (or press <kbd>Q</kbd>). | Discards everything before the playhead; keeps everything after. |
| **Trim the ending** (remove excess footage at end) | Scrub to where the video should end, click **`Trim End ✂️`** (or press <kbd>W</kbd>). | Discards everything after the playhead; keeps everything before. |
| **Merge multiple video files together** | Click **`🔀 Merge Files...`** in the toolbar, add files, and click **`⚡ Merge`**. | Combines separate video files into one seamless video at SSD write speed! |

---

## 4. Under the Hood: Architecture & Low-RAM Engineering

```mermaid
flowchart TD
    subgraph UI ["Renderer (React + Vite)"]
        CanvasTimeline["Canvas 2D Timeline (Single buffer, 0 DOM bloat)"]
        HTML5Video["HTML5 &lt;video&gt; Element"]
        Zustand["Zustand Reactive State Store (&lt;1MB RAM)"]
    end

    subgraph Main ["Electron Main Process (Node.js)"]
        HTTPStreamer["Local HTTP 206 Streaming Server (127.0.0.1)"]
        ProcessManager["Ephemeral FFmpeg Process Spawner"]
    end

    subgraph OS ["Operating System & Storage"]
        SourceVideo[("Original Video File (10GB - 100GB+)")]
        FFmpegBinaries["System FFmpeg / FFprobe"]
        ExportedVideo[("Direct Stream Export")]
    end

    HTML5Video <-->|HTTP Range Requests: bytes=start-end| HTTPStreamer
    HTTPStreamer <-->|fs.createReadStream(start, end)| SourceVideo
    ProcessManager -->|Spawns On-Demand: -c copy| FFmpegBinaries
    FFmpegBinaries -->|Direct Stream Copy| ExportedVideo
```

### 1. Local HTTP 206 Range Streamer
When you open a 50 GB file, ClippyCut **never** loads the 50 GB into memory. The Electron main process launches a loopback HTTP server (`127.0.0.1:<random-port>`). When the HTML5 `<video>` requests a frame, Node reads only that byte range from disk via `fs.createReadStream({ start, end })` and returns `206 Partial Content`.
* **RAM footprint**: Constant **under 150 MB**, whether your video is 500 MB or 120 GB.

### 2. Hardware-Accelerated Canvas Timeline
Instead of generating hundreds of HTML `<div>` nodes for time rulers and markers (which bloat the DOM and cause garbage collection lag), the timeline renders onto a single HTML5 `<canvas>`. Sizing happens strictly via `ResizeObserver`, keeping CPU utilization at ~0%.

### 3. Ephemeral FFmpeg Processes
FFmpeg and FFprobe processes are never kept running in the background. They are spawned on demand (for probing metadata or exporting cuts) and exit immediately upon task completion, freeing all OS handles.

### 4. Keyframe Snapping
Compressed videos use **GOPs (Groups of Pictures)** beginning with an intra-coded frame (**I-frame / Keyframe**). Cutting strictly on keyframes guarantees that the exported video starts on a complete picture without gray, frozen, or corrupted frames. ClippyCut’s **`⏪`** and **`⏩`** buttons snap your playhead directly to keyframes.

---

## 5. Complete Keyboard Shortcuts Cheat Sheet

| Category | Shortcut | Action |
| :--- | :--- | :--- |
| **Playback** | <kbd>Space</kbd> or <kbd>K</kbd> | Play / Pause |
| **Navigation** | <kbd>←</kbd> / <kbd>→</kbd> or <kbd>J</kbd> / <kbd>L</kbd> | Seek backward / forward 1 second |
| | <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd> | Seek backward / forward 10 seconds |
| | <kbd>Ctrl</kbd> + <kbd>←</kbd> / <kbd>→</kbd> | Step backward / forward 1 frame (~0.04s) |
| | <kbd>Home</kbd> / <kbd>End</kbd> | Jump to start / end of video |
| **Cutting & Trimming** | <kbd>C</kbd> or <kbd>S</kbd> | **Cut / Split video at playhead** |
| | <kbd>X</kbd> | **Cut Out & Remove marked section** (when In & Out are set) |
| | <kbd>Q</kbd> or <kbd>[</kbd> | **Trim Start** (discard before playhead) |
| | <kbd>W</kbd> or <kbd>]</kbd> | **Trim End** (discard after playhead) |
| **Marking** | <kbd>I</kbd> | Set **In** point (Start Cut) |
| | <kbd>O</kbd> | Set **Out** point (End Cut) |
| | <kbd>Enter</kbd> | Add marked selection as cut segment |
| **Segment List** | <kbd>Delete</kbd> or <kbd>Backspace</kbd> | Delete currently active segment |

---

## 6. FAQ & Troubleshooting

### Why is export so fast?
ClippyCut does not re-encode your video. It copies the raw H.264/HEVC bitstream packets directly from the input container to the output container using FFmpeg's `-c copy`. A 20 GB video cut takes only 2 to 5 seconds.

### Will the exported video lose quality?
No. Because the raw compressed stream is copied bit-for-bit, there is **0% quality degradation** and 100% preservation of all audio tracks and metadata.

### What if my video has multiple audio tracks (e.g., OBS gameplay + microphone)?
ClippyCut uses `-map 0` during stream copy, ensuring that all audio tracks, secondary languages, microphone tracks, and subtitle streams in the original container are preserved in the output file.

### How do I run the app in development mode?
```powershell
Set-Location d:\Playground\video-editor
npm run dev
```

### How do I build an executable distribution?
```powershell
Set-Location d:\Playground\video-editor
npm run build
```
The compiled output is placed in `d:\Playground\video-editor\out\`.
