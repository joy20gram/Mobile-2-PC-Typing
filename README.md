# Mobile 2 PC Typing

Speak in Bangla or English on a mobile phone and send the text to a desktop browser.

## Beginner setup

1. Install Node.js from https://nodejs.org/
2. Open this folder in terminal
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000/pc.html` on the PC
6. On mobile, open `http://192.168.1.101:3000/mobile.html` (the PC Wi-Fi address may change, so check it with `ipconfig`).

If the page does not open, set Windows Wi-Fi network as **Private**, allow Node.js through Windows Firewall, and ensure both devices are on the same Wi-Fi network.

Both devices must use the same Wi-Fi network.

## Limitations

This MVP sends text to a browser page. It does not automatically control or paste text into every Windows application. Browser voice recognition requires Chrome/Edge and microphone permission.
