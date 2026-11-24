# Mobile 2 PC Typing

Speak in Bangla or English on a mobile phone and send the text to a desktop browser.

## Use it over the internet (recommended)

1. Sign in to [Render](https://render.com/) using the same GitHub account that owns this repository.
2. Choose **New + → Blueprint** and select `joy20gram/Mobile-2-PC-Typing`.
3. Confirm creating the service from `render.yaml` and wait for its deploy to finish.
4. Open the Render service URL ending in `.onrender.com`, then open `/pc.html` on your computer.
5. On your phone, open the same service URL with `/mobile.html` and enter the room code shown on the PC.

The phone and PC can now use different networks, including mobile data. The hosted URL uses HTTPS, which is needed for browser microphone access. The free hosting plan may take a little time to wake up after inactivity.

## Run locally (same Wi-Fi only)

1. Install Node.js from https://nodejs.org/
2. Open this folder in terminal.
3. Run `npm install`, then `npm start`.
4. Open `http://localhost:3000/pc.html` on the PC.
5. On the phone, open `http://<PC-Wi-Fi-IP>:3000/mobile.html`. Both devices must use the same Wi-Fi; Windows Firewall may also need to allow Node.js on a Private network.

## Limitations

This MVP sends text to a browser page. It does not automatically control or paste text into every Windows application. Browser voice recognition requires Chrome/Edge and microphone permission. Treat the room code like a private password; anyone who knows it can join that room.
