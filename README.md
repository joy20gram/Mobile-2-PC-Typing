# Mobile 2 PC Typing

Speak in Bangla or English on a mobile phone and send the text to a desktop browser.

## Run locally (same Wi-Fi)

1. Install Node.js from https://nodejs.org/
2. Open this folder in a terminal.
3. Run `npm install`, then `npm start`. Keep the terminal open while using the app.
4. On the PC, open `http://localhost:3000/pc.html`.
5. Find the PC's Wi-Fi IPv4 address with `ipconfig` (look under **Wireless LAN adapter Wi-Fi**, usually `192.168.x.x`).
6. Connect the phone to the same Wi-Fi network and open `http://<PC-Wi-Fi-IP>:3000/mobile.html`. For example: `http://192.168.1.101:3000/mobile.html`.

## Limitations

If the page cannot be reached, confirm both devices are on the same non-guest Wi-Fi network and that the PC server is still running. Some routers block communication between Wi-Fi devices (AP/client isolation); turn that setting off in the router. This MVP sends text to a browser page; it does not automatically control or paste text into every Windows application. Browser voice recognition requires Chrome/Edge and microphone permission. Treat the room code like a private password; anyone who knows it can join that room.
