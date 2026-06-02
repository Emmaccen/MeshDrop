## [v0.1.1] - 02-06-2026

### 🐞 Bug Fixes

- **Fast Send Text Messaging**
  - Text messages can now be sent and received in Fast Send mode.
  - Hitting Enter or the send button dispatches the message through the first active multichannel pipe via the existing `useSendMessage` hook.

- **Create / Join / QR Buttons Hidden on Fast Send Route**
  - The header and mobile sidebar footer no longer show Standard-mode connection buttons (`Create`, `Join`, `QR`) when the user is on `/fast`.
  - Prevents confusion since Fast Send has its own connection flow.

- **Sender Bubble: "Sending…" Indicator**
  - The sender's file bubble now shows a pulsing _Sending…_ text while chunks are being dispatched, then reveals the file preview when complete.
  - Previous progress bar was invisible because `SafeDataChannelSender` flushes synchronously on the JS main thread — React never gets a render slot mid-flush. Correct architectural fix is deferred; the pulsing indicator is honest UX for now.

- **Receiver OOM Crash on Large Files (Fast Send)**
  - `FileChunkManager` was storing the full `number[]` chunk payload in JavaScript heap memory as well as writing it to IndexedDB (WTF was I thinking!). With 4 parallel channels on iOS Safari (Limited process memory), a large file's worth of arrays caused an out-of-memory crash.
  - Fixed by storing an empty placeholder (`[]`) in `FileChunkManager` for file-type chunks. The singleton was only used as a chunk-count tracker; actual file data lives exclusively in IndexedDB. Standard mode is unaffected.

- **Assembly Race Condition on Fast Send (Missing Chunk)**
  - With 4 channels writing chunks to IndexedDB concurrently, the channel that delivered the final chunk could trigger file assembly before the other 3 channels had finished their own `saveChunk` awaits.
  - Fixed by registering every `saveChunk` promise in a per-file `inFlightSaves` map (keyed before the await). When `receivedCount === totalChunks`, the handler now does `await Promise.all(inFlightSaves.get(id))` — guaranteeing every chunk is persisted before `createDownloadStream` reads them back.

- **iOS PWA Keep-Alive Rewrite**
  - The original `useSilentAudioKeepAlive` created an `AudioContext` at call time, which iOS Safari rejected when triggered by background network events (no user gesture in scope).
  - Reworked to a single global `AudioContext` unlocked on the first `touchstart` or `click` event anywhere in the document. Subsequent keep-alive calls simply unmute the already-running oscillator (gain `0.001`) — no gesture required. Screen now stays on throughout Fast Send transfers on iPhone PWA.

- **Fast Send Chat Scroll Lock**
  - Added CSS flex constraints (`flex-1 min-h-0`) to the main layout and Radix `ScrollArea` on the `/fast` route so the message container respects viewport bounds and scrolls gracefully when receiving large numbers of files.
  - Connection status header now spans full width to match standard mode layout.

---

## [v0.1.0-beta.5] - 01-06-2026

### 🚀 Features

- **Fast Send Mode**
  - New `/fast` route powered by 4 parallel WebRTC data channels for up to 4× faster file transfers.
  - Peers connect via a short **Room ID** shared over internet for the handshake — actual file transfer is fully local.
  - Multi-channel ICE negotiation via Firebase Firestore signaling.
  - Multichannel round-robin chunk distribution with per-channel backpressure (`SafeDataChannelSender`).

- **Silent Audio Keep-Alive**
  - Replaced Screen Wake Lock API with a near-silent Web Audio oscillator (`useSilentAudioKeepAlive`) to prevent browser tab throttling on mobile during transfers.
  - More reliable than Wake Lock across browsers, especially iOS Safari.
  - Activates automatically when a connection is established; stops when idle.

### ✨ Enhancements

- **Persistent Username**
  - Username is now stored in `localStorage` (`meshdrop_username`) after first entry.
  - On subsequent connections, both Create and Join modals skip straight to the next step — no re-typing needed.
  - Username is visible and editable at any time from the sidebar footer chip.

- **Improved Onboarding**
  - Both Standard and Fast Send pages now show step-by-step setup guides for first-time users.
  - Clear same-network requirement notice: both devices must be on the same router **or hotspot**.
  - Explicit explanation that "Online" mode only uses internet for the initial handshake — file transfer is always local.
  - Fast Send page explains multichannel transfer and links back to Standard mode.

- **Standard ↔ Fast Send Navigation**
  - New **Modes** section in the sidebar lets users switch between Standard and Fast Send instantly.
  - "Sending large files? Try Fast Send" upsell on the Standard page's onboarding card.

- **Connection Mode Discovery Descriptions**
  - Online mode: room code shared via internet for the handshake only; no internet needed for the actual transfer.
  - Offline mode: pure QR code scan, zero internet dependency end-to-end.

- **Removed Inaccurate Connection Health Indicator**
  - Removed the `testP2PConnectivity` header badge — it was unreliable and didn't reflect real transfer capability.

### 🐞 Bug Fixes

- **Toast Storm on Connection Failure**
  - Fixed an infinite loop of error toasts when a connection dropped mid-transfer.
  - Each failed transfer ID is now tracked; further chunks for that ID are silently discarded after the first error toast.
  - `handleChannelClose()` immediately marks all in-flight transfers as stopped and halts keep-alive.
  - Fast Send disconnect fires a single deduped toast using Sonner's `id` option.

- **Auto-Scroll on Classic Page**
  - Fixed scroll-to-bottom not working reliably on the Standard chat page (Radix `ScrollArea` viewport wrapper issue).
  - Now uses the same `scrollIntoView` sentinel `<div>` pattern already in use on Fast Send.

- **Username Never Persisted on Join**
  - `JoinConnectionUserNameModal` previously never saved the username to `localStorage`. Fixed.

- **Pre-existing TypeScript Null Errors**
  - Added non-null assertions in `useMultiChannelConnect.ts` where TypeScript lost narrowing after object spread reassignment.

### 🎨 UI/UX Updates

- **Chat Bubble Redesign**
  - Sent messages: primary color background, slide-in from right, `rounded-2xl rounded-tr-sm` shape.
  - Received messages: muted background, slide-in from left, `rounded-2xl rounded-tl-sm` shape.
  - Direction-aware slide-in CSS animations (`animate-slide-in-right` / `animate-slide-in-left`).
  - Cleaner timestamp + sender layout, thinner progress bar, proper Download icon.

- **Input Disabled States**
  - Message textarea and file picker are now visually disabled with `cursor-not-allowed opacity-50` when no data channel is active.
  - Placeholder text reflects connection state ("Connect a device to start chatting…").

- **Inter Font**
  - Switched to Inter via `next/font/google` for improved readability across all platforms.

### ⚡️ Performance Improvements

- Silent audio keep-alive is significantly lighter on battery and CPU than Screen Wake Lock re-acquisition cycles.
- Firestore listener teardown on multichannel answer receipt prevents stale snapshot accumulation.

---

### 📌 Known Limitations

- Fast Send uses internet-only signaling (Room ID via Firestore); QR-based peer discovery is for Standard mode only.
- Hotspot-based connections may work but are not guaranteed depending on device NAT configuration.
- Sender-side transfer progress bar is not shown in Fast Send — `SafeDataChannelSender` flushes synchronously, blocking React renders. Planned for a future release via a `MessageChannel`-based progress bridge.

---

## [v0.1.0-beta.4] - 17-09-2025

### ✨ Enhancements

- **Improved User Experience**
  - Added multi-file picker for sharing files
  - Multiple media selection now sends in a single burst
  - Improved connection test feedback

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
