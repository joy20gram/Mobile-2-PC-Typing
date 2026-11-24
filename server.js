const path = require("path");
const fs = require("fs");
const express = require("express");
const { createServer } = require("http");
const { createServer: createHttpsServer } = require("https");
const { Server } = require("socket.io");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_request, response) => {
  response.status(200).send("ok");
});

const certDir = path.join(__dirname, "certs");
const certPath = path.join(certDir, "server-cert.pem");
const keyPath = path.join(certDir, "server-key.pem");
const caPath = path.join(certDir, "mobile-ca.crt");
const hasCertificates = fs.existsSync(certPath) && fs.existsSync(keyPath) && fs.existsSync(caPath);

function normalizeRoomId(roomId) {
  if (typeof roomId !== "string") return null;

  const room = roomId.trim().toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(room) ? room : null;
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("join-device", (payload) => {
      const room = normalizeRoomId(payload?.roomId);
      if (!room) return;
      socket.join(room);
      socket.emit("joined", { roomId: room });
    });

    socket.on("voice-text", (payload) => {
      const room = normalizeRoomId(payload?.roomId);
      if (!room || typeof payload.text !== "string" || !socket.rooms.has(room)) return;
      io.to(room).emit("text-update", {
        text: payload.text.slice(0, 5000),
        final: Boolean(payload.final)
      });
    });

    socket.on("clear-text", (payload) => {
      const room = normalizeRoomId(payload?.roomId);
      if (!room || !socket.rooms.has(room)) return;
      io.to(room).emit("text-cleared");
    });
  });
}

const port = Number(process.env.PORT) || 3000;
const httpServer = createServer(hasCertificates ? (request, response) => {
  const parsedUrl = new URL(request.url, `http://${request.headers.host}`);
  if (parsedUrl.pathname === "/ca.crt") {
    response.writeHead(200, {
      "Content-Type": "application/x-x509-ca-cert",
      "Content-Disposition": "attachment; filename=\"mobile-2-pc-root-ca.crt\""
    });
    fs.createReadStream(caPath).pipe(response);
    return;
  }

  const host = request.headers.host.split(":")[0];
  response.writeHead(302, { Location: `https://${host}:${httpsPort}${request.url}` });
  response.end();
} : app);
const io = new Server();
registerSocketHandlers(io);

let httpsPort = Number(process.env.HTTPS_PORT) || 3443;
if (hasCertificates) {
  const httpsServer = createHttpsServer({
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  }, app);
  io.attach(httpsServer);
  httpsServer.listen(httpsPort, "0.0.0.0", () => {
    console.log(`Secure app: https://localhost:${httpsPort}/pc.html`);
  });
} else {
  io.attach(httpServer);
}

httpServer.listen(port, "0.0.0.0", () => {
  if (hasCertificates) {
    console.log(`Install the phone certificate from: http://<PC-WIFI-IP>:${port}/ca.crt`);
    console.log(`HTTP redirects to HTTPS. Keyboard microphone remains available if needed.`);
  } else {
    console.log(`Mobile 2 PC Typing is running at http://localhost:${port}`);
    console.log(`Run npm run setup:https to enable the built-in phone microphone over Wi-Fi.`);
  }
});
