const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("join-device", ({ roomId }) => {
    if (typeof roomId !== "string") return;

    const room = roomId.trim().toUpperCase().slice(0, 12);
    if (!room) return;

    socket.join(room);
    socket.emit("joined", { roomId: room });
  });

  socket.on("voice-text", ({ roomId, text, final }) => {
    if (typeof roomId !== "string" || typeof text !== "string") return;

    const room = roomId.trim().toUpperCase().slice(0, 12);
    if (!room) return;

    io.to(room).emit("text-update", {
      text: text.slice(0, 5000),
      final: Boolean(final)
    });
  });

  socket.on("clear-text", ({ roomId }) => {
    if (typeof roomId !== "string") return;

    const room = roomId.trim().toUpperCase().slice(0, 12);
    if (!room) return;

    io.to(room).emit("text-cleared");
  });
});

const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Mobile 2 PC Typing is running at http://localhost:${port}`);
});
