const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_request, response) => {
  response.status(200).send("ok");
});

function normalizeRoomId(roomId) {
  if (typeof roomId !== "string") return null;

  const room = roomId.trim().toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(room) ? room : null;
}

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

const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Mobile 2 PC Typing is listening on port ${port}`);
});
