## [v0.1.0-beta.3] - 8-08-2025

### ✨ Enhancements

- **Improved Device Discoverability**

  - Added STUN URLs to help devices expose IPs and make connection discovery seamless.
  - Added automatic connection health check when the user loads the app.
  - Included connection status messages to help users predict if a connection will succeed.
  - General code refactoring for clarity and maintainability.

### 📌 Known Limitations

- **Media Streaming Constraints**
  After extensive exploration (32+ hours of testing and iteration), native file streaming for certain media types (e.g., MP4, MOV) isn't currently possible without format conversion (e.g., via FFmpeg).
  This is because many video formats store critical metadata at the _end_ of the file, preventing players from starting playback mid-transfer.
  To keep MeshDrop lean, offline-first, and fully client-based with **zero server dependencies**, I'm avoiding adding heavy media processing tools that would bloat the app bundle.
  For now, video files will still transfer successfully, but they must be fully received before playback is possible.

### 🛠 Future Considerations

I’d love community input on lightweight, browser-compatible solutions for partial media playback without large processing libraries, CPU heavy tasks or memory pressure.

Some potential paths to explore:

- Client-side MP4/MOV “moov atom” repositioning or reconstruction in JS/WebAssembly.
- Alternative file formats with streaming-friendly headers (e.g., WebM).
- Chunk-based transcoding pipelines that run entirely in the browser.

If you have ideas or proof-of-concepts, feel free to open a discussion or PR! 🚀

## [v0.1.0-beta.2] - 28-05-2025

### 🚀 Features

- **Improved Transfer Speed**  
  Improved file transfer speed by ~4x.

- **Optional Auto-Discovery via Short Code**  
  Peers can now connect using an easy-to-read short code. This enables quick, shareable peer discovery without needing to scan QR-Codes.

- **Firebase Signaling Layer Integration**  
  Firebase is now integrated for peer-to-peer signaling and handshake exchange, making connection setup faster and more reliable.

- **Advanced Chunking with IndexedDB + Streams**  
  File transfer now uses `ReadableStream` and IndexedDB, enabling transfer of _very large files_ without memory bottlenecks.

  > _This solves the memory overflow issues seen in `beta.1` when sending files over ~100MB._

- **Smart Screen Wake Lock Support**  
  MeshDrop now prevents the screen from dimming or sleeping during active file transfers, improving reliability especially during long sends.

- **PWA Installation Support**

  - Added manual “Install App” button for Progressive Web App installs.
  - Tracks install events and engagement for future UX improvements.

- **Lightweight Analytics**  
  Anonymous usage tracking added to collect feedback, improve features, and measure app performance and stability.

---

### 🐞 Bug Fixes

- Fixed WebRtc Buffer choking on large files by implementing a wait-&-flush system
- Connected peers can now be found on the sidebar
- Fixed errors in WakeLock Manager (Race-cons, multi-instances etc)
- File chunking and reassembly on both ends now leverage streaming and DB-Indexing

---

### ⚡️ Performance Improvements

- Reduced memory consumption across all transfer operations
- Faster handshake response times and connection reliability
- Optimized Firebase listener teardown to prevent resource leaks

---

### 🎨 UI/UX Updates

- Improved peer connection flow with clearer prompts
- Added visual feedback on successful connection and transfer completion
- Better error messages and fallback states

---

### 🛠 Developer Notes

- Versioned as `v0.1.0-beta.2` to continue beta testing before the first stable `v1.0.0`
- Ideal for testing on both desktop and mobile (especially PWA)

---

### 📌 What’s Next

- Covered in README but... Failed transfer resume-ability sounds important.
- Streaming! Video files should be stream-able as they arrive.

---

_Thanks to everyone testing and sharing feedback! Feel free to file issues or join the project if you’re interested in contributing._

## [v0.1.0-beta.1] - 08-05-2025

### Initial Release

- Peer-to-peer file sharing over WebRTC
- Connection setup via QR-Codes
- Chunked file sending (limited to ~100MB due to memory handling)
- Works entirely offline without needing internet
- Intuitive UI
