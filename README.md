# Mobile 2 PC Typing

Speak in Bangla or English on a mobile phone and send the text to the PC screen or the active Windows app.

## Run locally (same Wi-Fi)

1. Install Node.js from https://nodejs.org/
2. Install mkcert by running `winget install FiloSottile.mkcert` in PowerShell.
3. Open this folder in a terminal and run `npm install`.
4. Run `npm run setup:https`. This creates a private certificate on this PC for its current Wi-Fi IP. Keep the generated `certs` folder private; it is ignored by Git.
5. On your phone, open `http://<PC-Wi-Fi-IP>:3000/ca.crt` (for example `http://192.168.1.101:3000/ca.crt`) to download the local certificate.
6. On Android, install it as a **CA certificate** in **Settings → Security & privacy → More security settings → Encryption & credentials → Install a certificate → CA certificate**. Android menu names vary by phone. Only install this certificate on your own phone; it lets that phone trust HTTPS sites signed by this PC's local development certificate.
7. Restart the server with `npm start`. Open `https://<PC-Wi-Fi-IP>:3443/pc.html` on the PC and `https://<PC-Wi-Fi-IP>:3443/mobile.html` on the phone. Allow microphone access when Chrome asks.
8. Copy the room code from the PC page. On the phone, enter it and tap **Connect to PC**. The status will confirm whether the PC receiver is connected.
9. To type into the foreground Windows app, open another PowerShell in this project folder and run `$env:PC_WIFI_IP="<PC-Wi-Fi-IP>"; npm run desktop`. Enter the same room code.
10. When ready to dictate, type `arm` in that terminal. You have 5 seconds to focus the target app and click its text field. Type `disarm` to stop accepting typed text, or `q` to quit the helper.

The phone and PC must be on the same Wi-Fi. If the PC's Wi-Fi IP changes, run `npm run setup:https` again and download/install the renewed certificate.

## Limitations

Every successful send clears the phone's text box. The PC page inserts each sent phrase at the current cursor position in its text box without deleting earlier text. The optional Windows helper types sent text into whichever app is focused; when armed, it receives the phrase instead of the browser page to prevent duplicate typing. Keep it disarmed except while you are dictating, and do not leave it armed over password or other sensitive fields. Anyone who knows the room code can send text while the helper is armed.

If the built-in microphone is blocked, tap **Use keyboard mic**, speak using your phone keyboard's microphone, then tap **Send**. Browser speech recognition may send audio to the browser provider for processing.
