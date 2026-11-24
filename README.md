# Mobile 2 PC Typing

Speak in Bangla or English on a mobile phone and send the text to a desktop browser.

## Beginner setup

1. Install Node.js from https://nodejs.org/
2. Open this folder in terminal
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000/pc.html` on the PC
6. Open the shown PC address on the mobile, for example `http://192.168.1.10:3000/mobile.html`

Both devices must use the same Wi-Fi network.

## Limitations

This MVP sends text to a browser page. It does not automatically control or paste text into every Windows application. Browser voice recognition requires Chrome/Edge and microphone permission.
