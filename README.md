# Mobile 2 PC Typing

Speak in Bangla or English on a mobile phone and send the text to a desktop browser.

## Run locally (same Wi-Fi)

1. Install Node.js from https://nodejs.org/
2. Install mkcert by running `winget install FiloSottile.mkcert` in PowerShell.
3. Open this folder in a terminal and run `npm install`.
4. Run `npm run setup:https`. This creates a private certificate on this PC for its current Wi-Fi IP. Keep the generated `certs` folder private; it is ignored by Git.
5. On your phone, open `http://<PC-Wi-Fi-IP>:3000/ca.crt` (for example `http://192.168.1.101:3000/ca.crt`) to download the local certificate.
6. On Android, install it as a **CA certificate** in **Settings → Security & privacy → More security settings → Encryption & credentials → Install a certificate → CA certificate**. Android menu names vary by phone. Only install this certificate on your own phone; it lets that phone trust HTTPS sites signed by this PC's local development certificate.
7. Restart the server with `npm start`. Open `https://<PC-Wi-Fi-IP>:3443/pc.html` on the PC and `https://<PC-Wi-Fi-IP>:3443/mobile.html` on the phone. Allow microphone access when Chrome asks.

The phone and PC must be on the same Wi-Fi. If the PC's Wi-Fi IP changes, run `npm run setup:https` again and download/install the renewed certificate.

## Limitations

If the built-in microphone is blocked, tap **Use keyboard mic**, speak using your phone keyboard's microphone, then tap **Send**. Browser speech recognition may send audio to the browser provider for processing. This MVP sends text to a browser page; it does not automatically control or paste text into every Windows application. Treat the room code like a private password; anyone who knows it can join that room.
