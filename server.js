const path = require("path");
const fs = require("fs");
const express = require("express");
const { createServer } = require("http");
const { createServer: createHttpsServer } = require("https");
const { Server } = require("socket.io");
const QRCode = require("qrcode");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_request, response) => {
  response.status(200).send("ok");
});

app.get("/api/pairing-qr", async (request, response, next) => {
  const roomId = normalizeRoomId(request.query.room);
  const host = request.get("host") || "";
  if (!roomId || !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host)) {
    response.status(400).json({ error: "Invalid room code or host." });
    return;
  }

  try {
    const mobileUrl = new URL("/mobile.html", `https://${host}`);
    mobileUrl.searchParams.set("room", roomId);
    const dataUrl = await QRCode.toDataURL(mobileUrl.toString(), {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240
    });
    response.set("Cache-Control", "no-store");
    response.json({ dataUrl, mobileUrl: mobileUrl.toString() });
  } catch (error) {
    next(error);
  }
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
    socket.on("join-device", async (payload, acknowledge) => {
      const room = normalizeRoomId(payload?.roomId);
      const role = payload?.role;
      if (!room || !["pc", "mobile", "desktop"].includes(role)) {
        acknowledge?.({ ok: false, error: "Enter a valid room code." });
        return;
      }

      const previousRoom = socket.data.roomId;
      if (previousRoom && previousRoom !== room) {
        await socket.leave(previousRoom);
      }
      await socket.join(room);
      socket.data.roomId = room;
      socket.data.role = role;
      socket.data.armed = false;

      const peers = await io.in(room).fetchSockets();
      acknowledge?.({
        ok: true,
        roomId: room,
        peerCount: peers.filter((peer) => peer.id !== socket.id).length
      });
    });

    socket.on("desktop-typing-state", (payload) => {
      const room = normalizeRoomId(payload?.roomId);
      if (
        !room ||
        socket.data.roomId !== room ||
        socket.data.role !== "desktop" ||
        !socket.rooms.has(room)
      ) return;

      socket.data.armed = Boolean(payload.armed);
      io.to(room).except(socket.id).emit("desktop-typing-state", {
        armed: socket.data.armed
      });
    });

    socket.on("voice-text", async (payload, acknowledge) => {
      const room = normalizeRoomId(payload?.roomId);
      if (
        !room ||
        !payload ||
        typeof payload.text !== "string" ||
        !socket.rooms.has(room) ||
        socket.data.roomId !== room ||
        socket.data.role !== "mobile"
      ) {
        acknowledge?.({ ok: false, error: "Connect to the PC room before sending." });
        return;
      }

      const text = payload.text.slice(0, 5000);
      if (!text.trim()) {
        acknowledge?.({ ok: false, error: "There is no text to send." });
        return;
      }

      const peers = await io.in(room).fetchSockets();
      const armedDesktopReceivers = peers.filter((peer) =>
        peer.id !== socket.id &&
        peer.data.role === "desktop" &&
        peer.data.armed
      );
      const receivers = armedDesktopReceivers.length
        ? armedDesktopReceivers
        : peers.filter((peer) =>
        peer.id !== socket.id && ["pc", "desktop"].includes(peer.data.role)
      );
      if (receivers.length === 0) {
        acknowledge?.({ ok: false, error: "No PC receiver is connected to this room." });
        return;
      }

      io.to(receivers.map((receiver) => receiver.id)).emit("text-update", {
        text,
        final: Boolean(payload.final)
      });
      acknowledge?.({ ok: true, receiverCount: receivers.length });
    });

    socket.on("disconnect", () => {
      if (socket.data.role === "desktop" && socket.data.roomId) {
        io.to(socket.data.roomId).emit("desktop-typing-state", { armed: false });
      }
      socket.data.roomId = null;
      socket.data.role = null;
      socket.data.armed = false;
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
