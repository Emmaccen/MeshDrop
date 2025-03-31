# MeshFlow

MeshFlow is a browser-based file transfer solution that enables seamless, direct device-to-device file sharing without the need for installation or cloud services. Using WebRTC technology, MeshFlow allows devices on the same network to quickly and securely transfer files of any size while maintaining privacy and cross-platform compatibility.

## Features

- **Zero Installation**: Works directly in modern browsers with no apps to download
- **Cross-Platform**: Share between any devices regardless of operating system
- **Direct Transfer**: Files move directly between devices, never touching the cloud
- **Background Processing**: Continue transfers even when navigating away (via Web Workers)
- **Multiple File Support**: Transfer multiple files simultaneously
- **OS Agnostic**: Works on Windows, macOS, Linux, iOS, Android, or any device with a modern browser
- **Privacy-Focused**: No data is stored on external servers
- **Completely Offline**: Functions without any internet connection
- **Progressive Web App**: Install on your device for quick access
- **Familiar Interface**: Designed like popular messaging apps for intuitive use

## How It Works

MeshFlow uses WebRTC data channels to establish peer-to-peer connections between devices on the same network, enabling direct file transfer without intermediary servers. Files are broken down into manageable chunks (15KB) and reassembled on the receiving device, allowing for efficient transfer of files of any size.

Connection between devices is established via QR code scanning, ensuring a secure handshake process even in environments with no internet access.

## Use Cases

- Transfer photos between your phone and laptop without cables or apps
- Share documents with colleagues on the same network
- Move files between different operating systems without compatibility issues
- Exchange files during meetings without email or messaging services
- Share files during outdoor activities with no internet (camping, field work, etc.)
- Chat with nearby devices completely offline

## Technical Implementation

MeshFlow leverages several modern web technologies:

- **WebRTC**: For direct peer-to-peer connections
- **Web Workers**: To maintain transfers in the background
- **Uint8Array and ArrayBuffer**: For efficient binary data handling
- **TextEncoder/TextDecoder**: For reliable data identification
- **Chunked File Processing**: To handle files of any size
- **Service Workers**: For PWA functionality and background operation
- **QR Code Generation/Scanning**: For offline device pairing

## Future Plans

- **Mesh Networking Capability**: Relay transfers through intermediate devices to extend range
- **Resume Capability**: Continue transfers after disconnection
- **Directory Transfer**: Support for folder structures
- **End-to-End Encryption**: Additional security layer with optional password protection
- **Transfer Statistics**: Real-time speed and estimated completion time display
- **Push Notifications**: Alert users when someone wants to share files, even when the app is in the background
- **Automatic Discovery**: Optional network-based device discovery alongside manual QR handshakes
- **Smart TV Support**: Investigate compatibility with WebRTC-capable smart TVs for streaming media
- **Offline Mesh Networks**: Enable multi-device sharing in completely disconnected environments

## Getting Started

1. Clone this repository
2. Run `npm install` to install dependencies
3. Start the development server with `npm run dev`
4. Open the application in browsers on multiple devices connected to the same network
5. Use the QR code to establish a connection between devices
6. Begin chatting and transferring files

## Browser Compatibility

MeshFlow works on all modern browsers that support WebRTC data channels, including:
- Chrome (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Safari (iOS 11+ and macOS 10.13+)
- Edge (Chromium-based)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
