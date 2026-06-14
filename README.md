# MeshDrop

MeshDrop is a browser-based file transfer solution that enables seamless, direct device-to-device file sharing without the need for installation or cloud services. Using WebRTC technology, MeshDrop allows devices to quickly and securely transfer files of any size while maintaining privacy and cross-platform compatibility.

## Features

- **Zero Installation**: Works directly in modern browsers with no apps to download.
- **Fast Send Mode**: Utilizes 4 parallel WebRTC data channels for up to 4× faster transfers using an easy-to-share Room ID.
- **Cross-Platform & Device Agnostic**: Share between Windows, macOS, Linux, iOS, Android, and even Smart TVs—basically any device with a modern browser and WebRTC support.
- **No File Size Limits**: Leverages IndexedDB streaming to handle gigabyte-sized files without memory crashes (even on strict platforms like iOS Safari).
- **Direct Transfer**: Files move directly between devices peer-to-peer, never touching the cloud.
- **Silent Audio Keep-Alive**: Prevents devices from sleeping or dropping connections during large transfers using a near-silent Web Audio oscillator (bypassing flaky Wake Lock APIs).
- **Multiple File Support**: Transfer and queue multiple files simultaneously.
- **Privacy-Focused**: No file data is ever stored on external servers.
- **Completely Offline Option**: Standard mode uses local QR codes, functioning entirely without an internet connection once the app is loaded.
- **Progressive Web App**: Install on your device for quick, native-like access.

## How It Works

MeshDrop uses WebRTC data channels to establish peer-to-peer connections between devices, enabling direct file transfer without intermediary servers. 

- **Standard Mode (Offline)**: Connection is established via QR code scanning, ensuring a secure handshake process in environments with zero internet access.
- **Fast Send Mode (Online Handshake)**: Devices connect via a short Room ID shared over the internet (via Firebase signaling). Once the handshake completes, the actual file transfer remains fully local and peer-to-peer, utilizing multiplexed channels for maximum speed.

Files are broken down into manageable chunks, written safely to IndexedDB, and reassembled on the receiving device. This streaming architecture allows for efficient transfer of massive files without blowing up JavaScript heap memory.

## Use Cases

- Transfer massive 4K videos between your phone and laptop without cables.
- Send media directly to your Smart TV's browser for immediate viewing.
- Share documents with colleagues on the same network or hotspot.
- Move files between different operating systems without compatibility issues.
- Exchange files during meetings without relying on email limits.
- Share files during outdoor activities with no internet (Standard mode).

## Technical Implementation

MeshDrop leverages a powerful stack of modern web technologies:

- **WebRTC**: Multiplexed data channels for direct peer-to-peer connections.
- **IndexedDB**: For robust chunk buffering, preventing Out-Of-Memory (OOM) crashes on iOS Safari during large transfers.
- **Firebase Firestore**: Lightweight signaling layer for Fast Send Room ID handshakes.
- **Web Audio API**: An imperceptible oscillator that acts as a bulletproof keep-alive mechanism to prevent browser throttling.
- **Web Workers**: To maintain transfers and offload processing in the background.
- **Uint8Array and ArrayBuffer**: For efficient binary data handling.
- **Service Workers**: For PWA functionality and offline readiness.

## Future Plans

- **Granular Transfer Progress**: Dedicated Web Worker bridge to calculate real-time transfer statistics and progress bars without blocking the main UI thread during Fast Send.
- **Resume Capability**: Continue transfers automatically after brief network disconnections.
- **Directory Transfer**: Support for preserving and sharing entire folder structures.
- **End-to-End Encryption**: Additional security layer with optional password protection.
- **Push Notifications**: Alert users when someone wants to share files, even when the app is in the background.
- **Mesh Networking Capability**: Relay transfers through intermediate devices to extend range in offline environments.

## Getting Started

1. Clone this repository
2. Run `npm install` (or `yarn`) to install dependencies
3. Start the development server with `npm run dev`
4. Open the application in browsers on multiple devices (phones, laptops, Smart TVs) connected to the same network or hotspot.
5. Choose your mode:
   - **Fast Send**: Generate a Room ID on one device and enter it on the other.
   - **Standard**: Scan the generated QR code to connect completely offline.
6. Begin chatting and transferring files!

## Browser Compatibility

MeshDrop works on all modern browsers that support WebRTC data channels, including:
- Chrome (Desktop & Mobile)
- Safari (iOS 11+ and macOS 10.13+)
- Firefox (Desktop & Mobile)
- Edge (Chromium-based)
- Smart TV Browsers (WebOS, Tizen, Android TV—with WebRTC support)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue.

## Changelog

Track new features, fixes, and updates from the [changelog](https://github.com/Emmaccen/MeshDrop/blob/dev/changelog.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
